/* global jest, describe, beforeEach, afterEach, test, expect, global, require, Office, localStorage, document, HTMLButtonElement */

//TODO: change localhost links once everything has been deployed and also add some more tests for the other function

const officeMock = {
  onReady: jest.fn(),
  HostType: {
    Outlook: "Outlook",
  },
  context: {
    mailbox: {
      item: null as Office.MessageRead | null,
    },
  },
  CoercionType: {
    Text: "text",
  },
  AsyncResultStatus: {
    Succeeded: "succeeded",
    Failed: "failed",
  },
};

(global as any).Office = officeMock;

const { isTokenExpired, login, buildReportPayload, reportSelectedEmail } = require("./taskpane");

describe("taskpane authentication and reporting", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();

    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-07-19T13:00:00.000Z"));

    global.fetch = jest.fn();

    officeMock.context.mailbox.item = null;

    document.body.innerHTML = `
        <section id="status-message" class="status-message" hidden></section>

        <section id="login-section">
            <form id="login-form">
            <input id="login-email" />
            <input id="login-password" />
            <button id="login-button" type="submit">Sign in</button>
            </form>
        </section>

        <section id="report-section" hidden>
            <p id="current-user-details"></p>
            <span id="email-subject"></span>
            <span id="email-sender"></span>
            <button id="logout-button" type="button">Sign out</button>
            <button id="report-button" type="button">
            Report selected email
            </button>
        </section>
        `;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  function createFakeItem(overrides: Record<string, unknown> = {}): Office.MessageRead {
    return {
      itemId: "outlook-item-123",
      internetMessageId: "<message-123@example.com>",
      subject: "Email Subject Yeah Boii",
      from: {
        emailAddress: "attacker@example.com",
        displayName: "Fake Support",
      },
      dateTimeCreated: new Date("2026-07-19T11:30:00.000Z"),
      body: {
        getAsync: jest.fn((_coercionType, callback) => {
          callback({
            status: officeMock.AsyncResultStatus.Succeeded,
            value: "Click this suspicious link to win a Happy Meal.",
          });
        }),
      },
      ...overrides,
    } as unknown as Office.MessageRead;
  }

  function setValidSession(): void {
    localStorage.setItem("access_token", "valid-jwt");
    localStorage.setItem("token_expiry", String(new Date("2026-07-19T14:00:00.000Z").getTime()));
  }

  test("isTokenExpired should return false if the token has not epired and has a valid future expiry", () => {
    setValidSession();
    expect(isTokenExpired()).toBe(false);
  });

  test("login rejects invalid credentials without storing a session", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 401,
      json: jest.fn().mockResolvedValue({
        message: "Invalid email or password",
      }),
    });

    await expect(login("user@example.com", "wrong-password")).rejects.toThrow(
      "Invalid email or password"
    );

    expect(localStorage.getItem("access_token")).toBeNull();
    expect(localStorage.getItem("token_expiry")).toBeNull();
  });

  test("buildReportPayload should map the selected email correctly", async () => {
    const fakeItem = createFakeItem();
    const payload = await buildReportPayload(fakeItem);

    expect(payload).toEqual({
      outlookMessageId: "outlook-item-123",
      emailSubject: "Email Subject Yeah Boii",
      emailSender: "attacker@example.com",
      emailReceivedAt: "2026-07-19T11:30:00.000Z",
      emailBody: "Click this suspicious link to win a Happy Meal.",
    });
  });

  test("buildReportPayload should not work without a messageID", async () => {
    const fakeItem = createFakeItem({
      itemId: undefined,
      internetMessageId: undefined,
    });

    await expect(buildReportPayload(fakeItem)).rejects.toThrow(
      "Outlook could not determine the selected email ID"
    );
  });

  test("reportSelectedEmail sends the correct authenticated report", async () => {
    setValidSession();

    const fakeItem = createFakeItem();

    officeMock.context.mailbox.item = fakeItem;

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 201,
      json: jest.fn().mockResolvedValue({
        id: "report-123",
      }),
    });

    await reportSelectedEmail();

    expect(global.fetch).toHaveBeenCalledTimes(1);

    expect(global.fetch).toHaveBeenCalledWith("http://localhost:3001/api/report", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer valid-jwt",
      },
      body: JSON.stringify({
        outlookMessageId: "outlook-item-123",
        emailSubject: "Email Subject Yeah Boii",
        emailSender: "attacker@example.com",
        emailReceivedAt: "2026-07-19T11:30:00.000Z",
        emailBody: "Click this suspicious link to win a Happy Meal.",
      }),
    });

    const statusElement = document.getElementById("status-message");

    expect(statusElement?.textContent).toBe("The selected email was reported successfully.");
    expect(statusElement?.className).toBe("status-message status-success");
    expect(statusElement?.hidden).toBe(false);

    const reportButton = document.getElementById("report-button") as HTMLButtonElement;

    expect(reportButton.disabled).toBe(false);
    expect(reportButton.textContent).toBe("Report selected email");
  });

  test("reportSelectedEmail clears the session when the backend returns 401", async () => {
    setValidSession();

    officeMock.context.mailbox.item = createFakeItem();

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 401,
      json: jest.fn().mockResolvedValue({
        message: "Unauthorized",
      }),
    });

    await reportSelectedEmail();

    expect(localStorage.getItem("access_token")).toBeNull();
    expect(localStorage.getItem("token_expiry")).toBeNull();

    expect(document.getElementById("login-section")?.hidden).toBe(false);
    expect(document.getElementById("report-section")?.hidden).toBe(true);

    expect(document.getElementById("status-message")?.textContent).toBe(
      "Your session is invalid or has expired. Please sign in again."
    );
  });
});
