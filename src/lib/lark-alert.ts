import { createHmac } from "node:crypto";

// Lark "Custom Bot" group webhook — posts a message directly into the ops
// group when something in the recruitment automation fails (send failure,
// missing Lark field, etc.) so HR notices immediately instead of it only
// sitting in a server log nobody reads. Uses Lark's documented signature
// scheme (HMAC-SHA256 of "{timestamp}\n{secret}" over an empty message,
// base64-encoded) since "Signature Verification" is enabled on this bot.
export async function sendLarkAlert(text: string): Promise<void> {
  const url = process.env.LARK_ALERT_WEBHOOK_URL;
  const secret = process.env.LARK_ALERT_WEBHOOK_SECRET;
  if (!url) return; // not configured — degrade to silent no-op, callers already log locally

  try {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const body: Record<string, unknown> = {
      msg_type: "text",
      content: { text: `⚠️ [Tuyển dụng] ${text}` },
    };
    if (secret) {
      const stringToSign = `${timestamp}\n${secret}`;
      const sign = createHmac("sha256", stringToSign).update("").digest("base64");
      body.timestamp = timestamp;
      body.sign = sign;
    }

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.error(`[lark-alert] Gửi cảnh báo thất bại (${res.status}):`, await res.text());
    }
  } catch (err) {
    console.error("[lark-alert] Gửi cảnh báo thất bại:", err);
  }
}
