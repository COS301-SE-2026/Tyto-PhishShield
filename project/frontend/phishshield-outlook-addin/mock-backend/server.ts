import http, { IncomingMessage, ServerResponse } from "http";

const PORT = 3010;

interface PhishingReportPayload {
  subject?: string;
  from?: string;
  senderName?: string;
  itemId?: string;
  internetMessageId?: string;
  dateTimeCreated?: string;
  dateReported?: string;
  source?: string;
  reporterEmail?: string;
}

function setCorsHeaders(res: ServerResponse): void {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function readRequestBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk: Buffer) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      resolve(body);
    });

    req.on("error", (error) => {
      reject(error);
    });
  });
}

const server = http.createServer(async (req: IncomingMessage, res: ServerResponse) => {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === "POST" && req.url === "/api/phishing/report") {
    try {
      const body = await readRequestBody(req);
      const payload: PhishingReportPayload = JSON.parse(body);

      console.log("\n=== MOCK BACKEND RECEIVED PHISHING REPORT ===");
      console.log(payload);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: true,
          message: "Mock backend received phishing report",
          receivedAt: new Date().toISOString(),
        })
      );
    } catch (error) {
      console.error("Failed to process report:", error);

      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: false,
          message: "Invalid phishing report payload",
        })
      );
    }

    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(
    JSON.stringify({
      success: false,
      message: "Endpoint not found",
    })
  );
});

server.listen(PORT, () => {
  console.log(`Mock backend running at http://localhost:${PORT}`);
});