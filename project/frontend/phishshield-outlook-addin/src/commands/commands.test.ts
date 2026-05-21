/* global jest, describe, beforeEach, afterEach, test, expect, require, global, Office */

// Create fake Office environment because Office does not exist in Node/Jest
(global as any).Office = {
  onReady: jest.fn((callback) => callback()),
  context: {
    mailbox: {
      item: null,
      userProfile: {
        emailAddress: "johndaniel@tyto.co.za",
      },
    },
  },
  actions: {
    associate: jest.fn(),
  },
  CoercionType: {
    Text: "text",
  },
  AsyncResultStatus: {
    Succeeded: "succeeded",
    Failed: "failed",
  },
};

// require is used so the Office mock exists before commands.ts is loaded
const { buildPayload, sendPhishingReport, action } = require("./commands");

describe("commands.ts phishing report logic", () => {
  const backendUrl = "http://localhost:3010/api/phishing/report";
  const reporterEmail = "johndaniel@tyto.co.za";

  beforeEach(() => {
    jest.clearAllMocks();

    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-05-20T12:00:00Z"));

    global.fetch = jest.fn();

    (global as any).Office.context.mailbox.item = null;
    (global as any).Office.context.mailbox.userProfile.emailAddress = reporterEmail;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  function createFakeItem(overrides = {}) {
    return {
      subject: "Sus email",
      from: {
        emailAddress: "attacker@test.com",
        displayName: "Sender1",
      },
      itemId: "item-123",
      internetMessageId: "internet-message-123",
      dateTimeCreated: new Date("2026-05-20T10:00:00Z"),
      body: {
        getAsync: jest.fn((_coercionType, callback) => {
          callback({
            status: Office.AsyncResultStatus.Succeeded,
            value: "Click this suspicious link",
          });
        }),
      },
      notificationMessages: {
        replaceAsync: jest.fn(),
      },
      ...overrides,
    };
  }

  function createPayload(overrides = {}) {
    return {
      subject: "Sus email",
      from: "attacker@test.com",
      senderName: "Sender1",
      itemId: "item-123",
      internetMessageId: "internet-message-123",
      dateTimeCreated: "2026-05-20T10:00:00.000Z",
      dateReported: "2026-05-20T12:00:00.000Z",
      body: "Suspicious body",
      source: "outlook-addin",
      reporterEmail,
      ...overrides,
    };
  }

  test("buildPayload creates the correct phishing report payload", () => {
    const fakeItem = createFakeItem();

    const payload = buildPayload(fakeItem, "Click this suspicious link");

    expect(payload).toEqual({
      subject: "Sus email",
      from: "attacker@test.com",
      senderName: "Sender1",
      itemId: "item-123",
      internetMessageId: "internet-message-123",
      dateTimeCreated: "2026-05-20T10:00:00.000Z",
      dateReported: "2026-05-20T12:00:00.000Z",
      body: "Click this suspicious link",
      source: "outlook-addin",
      reporterEmail,
    });
  });

  test("buildPayload uses empty strings when optional email fields are missing", () => {
    const fakeItem = createFakeItem({
      subject: undefined,
      from: undefined,
      itemId: undefined,
      internetMessageId: undefined,
      dateTimeCreated: undefined,
    });

    const payload = buildPayload(fakeItem, "");

    expect(payload).toEqual({
      subject: "",
      from: "",
      senderName: "",
      itemId: "",
      internetMessageId: "",
      dateTimeCreated: "",
      dateReported: "2026-05-20T12:00:00.000Z",
      body: "",
      source: "outlook-addin",
      reporterEmail,
    });
  });

  test("sendPhishingReport sends payload to backend using POST and JSON", async () => {
    const payload = createPayload();

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ message: "Report received" }),
    });

    await sendPhishingReport(payload);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      backendUrl,
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })
    );
  });

  test("sendPhishingReport returns failed backend response", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
    });

    const response = await sendPhishingReport(createPayload());

    expect(response.ok).toBe(false);
    expect(response.status).toBe(500);
  });

  test("action reads email body, sends report, shows notification, and completes event", async () => {
    const fakeItem = createFakeItem();
    const fakeEvent = {
      completed: jest.fn(),
    };

    (global as any).Office.context.mailbox.item = fakeItem;

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ message: "Report received" }),
    });

    await action(fakeEvent);

    expect(fakeItem.body.getAsync).toHaveBeenCalledWith(
      Office.CoercionType.Text,
      expect.any(Function)
    );

    expect(global.fetch).toHaveBeenCalledTimes(1);

    const sentBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);

    expect(sentBody).toEqual({
      subject: "Sus email",
      from: "attacker@test.com",
      senderName: "Sender1",
      itemId: "item-123",
      internetMessageId: "internet-message-123",
      dateTimeCreated: "2026-05-20T10:00:00.000Z",
      dateReported: "2026-05-20T12:00:00.000Z",
      body: "Click this suspicious link",
      source: "outlook-addin",
      reporterEmail,
    });

    expect(fakeItem.notificationMessages.replaceAsync).toHaveBeenCalledWith(
      "phishshield-report",
      expect.objectContaining({
        message: "Reported: Sus email",
        persistent: false,
      })
    );

    expect(fakeEvent.completed).toHaveBeenCalledTimes(1);
  });

  test("action completes event without sending report when no email item is selected", async () => {
    const fakeEvent = {
      completed: jest.fn(),
    };

    (global as any).Office.context.mailbox.item = null;

    await action(fakeEvent);

    expect(global.fetch).not.toHaveBeenCalled();
    expect(fakeEvent.completed).toHaveBeenCalledTimes(1);
  });

  test("action sends report with empty body when email body cannot be read", async () => {
    const fakeItem = createFakeItem({
      body: {
        getAsync: jest.fn((_coercionType, callback) => {
          callback({
            status: Office.AsyncResultStatus.Failed,
            error: "Could not read body",
          });
        }),
      },
    });

    const fakeEvent = {
      completed: jest.fn(),
    };

    (global as any).Office.context.mailbox.item = fakeItem;

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ message: "Report received" }),
    });

    await action(fakeEvent);

    expect(global.fetch).toHaveBeenCalledTimes(1);

    const sentBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);

    expect(sentBody.body).toBe("");
    expect(sentBody.reporterEmail).toBe(reporterEmail);
    expect(fakeEvent.completed).toHaveBeenCalledTimes(1);
  });
});
