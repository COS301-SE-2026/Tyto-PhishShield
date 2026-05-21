/* global Office, console, fetch */

const BACKEND_REPORT_URL = "http://localhost:3001/api/report";

export interface PhishingReportPayload {
  subject: string;
  from: string;
  senderName: string;
  itemId: string;
  internetMessageId: string;
  dateTimeCreated: string;
  dateReported: string;
  body: string;
  source: "outlook-addin";
  reporterEmail: string;
}

Office.onReady(() => {
  console.log("Tyto PhishShield command file loaded.");
});

function showNotification(message: string): void {
  const item = Office.context.mailbox.item;

  if (!item) return;

  item.notificationMessages.replaceAsync("phishshield-report", {
    type: "informationalMessage",
    message,
    icon: "Icon.16x16",
    persistent: false,
  });
}

export async function sendPhishingReport(reportPayload: PhishingReportPayload): Promise<any> {
  return fetch(BACKEND_REPORT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(reportPayload),
  });
}

async function sendReportToBackend(reportPayload: PhishingReportPayload): Promise<void> {
  const response = await sendPhishingReport(reportPayload);
  const result = await response.json().catch(() => null);

  if (!response.ok) {
    console.error("Backend report failed:", result);
    throw new Error(`Backend returned status ${response.status}`);
  }

  console.log("Backend report response:", result);
}

function getEmailBody(item: Office.MessageRead): Promise<string> {
  return new Promise((resolve) => {
    if (!item.body) {
      resolve("");
      return;
    }

    item.body.getAsync(Office.CoercionType.Text, (result: Office.AsyncResult<string>) => {
      if (result.status === Office.AsyncResultStatus.Succeeded) {
        resolve(result.value || "");
      } else {
        console.error("Could not read email body:", result.error);
        resolve("");
      }
    });
  });
}

function getDateTimeCreatedAsString(dateTimeCreated: Date | undefined): string {
  return dateTimeCreated ? dateTimeCreated.toISOString() : "";
}

function getReporterEmail(): string {
  return Office.context.mailbox.userProfile?.emailAddress || "";
}

export function buildPayload(item: Office.MessageRead, body: string): PhishingReportPayload {
  return {
    subject: item.subject || "",
    from: item.from?.emailAddress || "",
    senderName: item.from?.displayName || "",
    itemId: item.itemId || "",
    internetMessageId: item.internetMessageId || "",
    dateTimeCreated: getDateTimeCreatedAsString(item.dateTimeCreated),
    dateReported: new Date().toISOString(),
    body,
    source: "outlook-addin",
    reporterEmail: getReporterEmail(),
  };
}

export async function action(event: Office.AddinCommands.Event): Promise<void> {
  try {
    console.log("Report Phish button clicked.");

    const item = Office.context.mailbox.item;

    if (!item) {
      console.error("No email item selected.");
      return;
    }

    const emailBody = await getEmailBody(item);
    const reportPayload = buildPayload(item, emailBody);

    console.log("=== PHISH REPORT PAYLOAD ===");
    console.log(reportPayload);

    await sendReportToBackend(reportPayload);

    showNotification(`Reported: ${reportPayload.subject}`);
  } catch (error) {
    console.error("Failed to report phishing email:", error);
    showNotification("Could not report email. Check backend and console.");
  } finally {
    event.completed();
  }
}

Office.actions.associate("action", action);
