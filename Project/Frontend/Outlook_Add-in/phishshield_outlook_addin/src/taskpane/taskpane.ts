/*
 * Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
 * See LICENSE in the project root for license information.
 */

/* global document, Office */

Office.onReady((info: any) => {
  if (info.host === Office.HostType.Outlook) {
    const sideloadMsg = document.getElementById("sideload-msg");
    const appBody = document.getElementById("app-body");
    const runButton = document.getElementById("run");

    if (sideloadMsg) {
      sideloadMsg.style.display = "none";
    }

    if (appBody) {
      appBody.style.display = "flex";
    }

    if (runButton) {
      runButton.onclick = run;
    }
  }
});

export async function run(): Promise<void> {
  const item = Office.context.mailbox.item;
  const insertAt = document.getElementById("item-subject");

  if (!insertAt || !item) {
    return;
  }

  const label = document.createElement("b");
  label.appendChild(document.createTextNode("Subject: "));

  insertAt.appendChild(label);
  insertAt.appendChild(document.createElement("br"));
  insertAt.appendChild(document.createTextNode(item.subject || ""));
  insertAt.appendChild(document.createElement("br"));
}
