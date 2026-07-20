/*
 * Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
 * See LICENSE in the project root for license information.
 */

/* global document, Office, fetch, localStorage, console, HTMLElement, HTMLInputElement, HTMLButtonElement, HTMLFormElement, Response, Event */

const API_BASE = "http://localhost:3001/api";

const LOGIN_URL = `${API_BASE}/accounts/auth/login`;
const ME_URL = `${API_BASE}/accounts/auth/me`;
const REPORT_URL = `${API_BASE}/report`;

interface LoginResponse {
  access_token: string;
  expires_in: number;
}

interface AuthenticatedUser {
  auth0Id: string;
  role: string;
}

interface PhishingReportPayload {
  outlookMessageId: string;
  emailSubject?: string;
  emailSender?: string;
  emailReceivedAt?: string;
  emailBody?: string;
}

function getElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);

  if (!element) {
    throw new Error(`Element with ID "${id}" was not found.`);
  }

  return element as T;
}

function getAccessToken(): string | null {
  return localStorage.getItem("access_token");
}

function clearSession(): void {
  localStorage.removeItem("access_token");
  localStorage.removeItem("token_expiry");
}

export function isTokenExpired(): boolean {
  const expiry = Number(localStorage.getItem("token_expiry") ?? 0);

  return !expiry || Date.now() >= expiry;
}

function showStatus(message: string, type: "info" | "success" | "error" = "info"): void {
  const statusElement = getElement<HTMLElement>("status-message");

  statusElement.textContent = message;
  statusElement.className = `status-message status-${type}`;
  statusElement.hidden = false;
}

function hideStatus(): void {
  const statusElement = getElement<HTMLElement>("status-message");

  statusElement.hidden = true;
  statusElement.textContent = "";
}

function showLoginSection(): void {
  getElement<HTMLElement>("login-section").hidden = false;
  getElement<HTMLElement>("report-section").hidden = true;
}

function showReportSection(user: AuthenticatedUser): void {
  getElement<HTMLElement>("login-section").hidden = true;
  getElement<HTMLElement>("report-section").hidden = false;
  getElement<HTMLElement>("current-user-details").textContent = `Role: ${user.role}`;
}

export async function parseErrorMessage(response: Response): Promise<string> {
  const body: unknown = await response.json().catch(() => null);

  if (typeof body === "object" && body !== null && "message" in body) {
    const message = (body as { message?: unknown }).message;

    if (Array.isArray(message)) {
      return message.join("; ");
    }

    if (typeof message === "string") {
      return message;
    }
  }

  return `Request failed with status ${response.status}`;
}

export async function getCurrentUser(token: string): Promise<AuthenticatedUser> {
  const response = await fetch(ME_URL, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return response.json() as Promise<AuthenticatedUser>;
}

export async function restoreSession(): Promise<void> {
  const token = getAccessToken();

  if (!token || isTokenExpired()) {
    clearSession();
    showLoginSection();
    return;
  }

  try {
    const user = await getCurrentUser(token);

    showReportSection(user);
  } catch (error) {
    console.error("Could not restore session:", error);

    clearSession();
    showLoginSection();
  }
}

export async function login(email: string, password: string): Promise<void> {
  const response = await fetch(LOGIN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  const result = (await response.json()) as LoginResponse;

  if (!result.access_token || !result.expires_in) {
    throw new Error("the login response did not contain a valid accesss token.");
  }

  localStorage.setItem("access_token", result.access_token);
  localStorage.setItem("token_expiry", String(Date.now() + result.expires_in * 1000));

  const user = await getCurrentUser(result.access_token);

  showReportSection(user);
}

export async function handleLogin(event: Event): Promise<void> {
  event.preventDefault();

  hideStatus();

  const emailInput = getElement<HTMLInputElement>("login-email");
  const passwordInput = getElement<HTMLInputElement>("login-password");
  const loginButton = getElement<HTMLButtonElement>("login-button");

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    showStatus("Enter both your email address and password.", "error");

    return;
  }

  loginButton.disabled = true;
  loginButton.textContent = "Signing in...";

  try {
    await login(email, password);

    passwordInput.value = "";

    showStatus("Signed in successfully.", "success");
  } catch (error) {
    console.error("Login failed:", error);

    showStatus(error instanceof Error ? error.message : "Could not sign in.", "error");
  } finally {
    loginButton.disabled = false;
    loginButton.textContent = "Sign in";
  }
}

export function logout(): void {
  clearSession();
  hideStatus();
  showLoginSection();
}

export function getEmailBody(item: Office.MessageRead): Promise<string> {
  return new Promise((resolve) => {
    if (!item.body) {
      resolve("");

      return;
    }

    item.body.getAsync(Office.CoercionType.Text, (result: Office.AsyncResult<string>) => {
      if (result.status === Office.AsyncResultStatus.Succeeded) {
        resolve(result.value || "");

        return;
      }

      console.error("Could not read the email body:", result.error);

      resolve("");
    });
  });
}

export async function buildReportPayload(item: Office.MessageRead): Promise<PhishingReportPayload> {
  const emailBody = await getEmailBody(item);
  const outlookMessageId = item.itemId || item.internetMessageId;

  if (!outlookMessageId) {
    throw new Error("Outlook could not determine the selected email ID");
  }

  return {
    outlookMessageId,
    emailSubject: item.subject || undefined,
    emailSender: item.from?.emailAddress || undefined,
    emailReceivedAt: item.dateTimeCreated?.toISOString(),
    emailBody: emailBody || undefined,
  };
}

export function displaySelectedEmail(item: Office.MessageRead): void {
  getElement<HTMLElement>("email-subject").textContent = item.subject || "No Subject";

  getElement<HTMLElement>("email-sender").textContent = item.from?.emailAddress || "Unknown sender";
}

export async function reportSelectedEmail(): Promise<void> {
  hideStatus();
  const token = getAccessToken();

  if (!token || isTokenExpired()) {
    clearSession();
    showLoginSection();

    showStatus("Your session has expired. Please sign in again.", "error");

    return;
  }

  const item = Office.context.mailbox.item;

  if (!item) {
    showStatus("No email is currently selected.", "error");

    return;
  }

  const reportButton = getElement<HTMLButtonElement>("report-button");
  reportButton.disabled = true;
  reportButton.textContent = "Reporting..";

  try {
    const payload = await buildReportPayload(item);
    console.log("Submitting report:", payload);

    const response = await fetch(REPORT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      if (response.status === 401) {
        clearSession();
        showLoginSection();

        throw new Error("Your session is invalid or has expired. Please sign in again.");
      }

      throw new Error(await parseErrorMessage(response));
    }

    const result: unknown = await response.json().catch(() => null);

    console.log("Report created:", result);

    showStatus("The selected email was reported successfully.", "success");
  } catch (error) {
    console.error("Could not report email:", error);

    showStatus(
      error instanceof Error ? error.message : "Could not report the selected email.",
      "error"
    );
  } finally {
    reportButton.disabled = false;
    reportButton.textContent = "Report selected email";
  }
}

Office.onReady((info) => {
  if (info.host !== Office.HostType.Outlook) {
    return;
  }
  const item = Office.context.mailbox.item;

  if (item) {
    displaySelectedEmail(item);
  }

  const loginForm = getElement<HTMLFormElement>("login-form");
  const logoutButton = getElement<HTMLButtonElement>("logout-button");
  const reportButton = getElement<HTMLButtonElement>("report-button");

  loginForm.addEventListener("submit", (event) => {
    void handleLogin(event);
  });

  logoutButton.addEventListener("click", logout);

  reportButton.addEventListener("click", () => {
    void reportSelectedEmail();
  });

  void restoreSession();
});
