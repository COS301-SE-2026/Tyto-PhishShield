/*
 * Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
 * See LICENSE in the project root for license information.
 */

declare const Office: any;

Office.onReady(() => {
  console.log("Tyto PhishShield command file loaded.");
});

export async function action(event: any) {
  try {
    console.log("Report Phish button clicked.");

    const item = Office.context.mailbox.item;

    if (!item) {
      console.error("No email item selected.");
      event.completed();
      return;
    }

    const reportPayload = {
      subject: item.subject || "",
      from: item.from?.emailAddress || "",
      senderName: item.from?.displayName || "",
      itemId: item.itemId || "",
      dateReported: new Date().toISOString(),
      source: "outlook-addin",
    };

    console.log("=== PHISH REPORT PAYLOAD ===");
    console.log(reportPayload);

    Office.context.mailbox.item.notificationMessages.replaceAsync(
      "phishshield-report",
      {
        type: "informationalMessage",
        message: `Reported: ${reportPayload.subject}`,
        persistent: false,
      }
    );
  } catch (error) {
    console.error("Failed to report phishing email:", error);
  } finally {
    event.completed();
  }
}

Office.actions.associate("action", action);