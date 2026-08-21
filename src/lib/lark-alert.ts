import { createHmac } from "node:crypto";

// Lark "Custom Bot" group webhook — posts straight into the ops group so
// HR can see what the recruitment automation is doing without checking
// server logs or reverse-engineering blank Lark columns. Uses Lark's
// documented signature scheme (HMAC-SHA256 of "{timestamp}\n{secret}" over
// an empty message, base64-encoded) since "Signature Verification" is
// enabled on this bot.
async function post(text: string): Promise<void> {
  const url = process.env.LARK_ALERT_WEBHOOK_URL;
  const secret = process.env.LARK_ALERT_WEBHOOK_SECRET;
  if (!url) return; // not configured — degrade to silent no-op, callers already log locally

  try {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const body: Record<string, unknown> = {
      msg_type: "text",
      content: { text },
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
      console.error(`[lark-alert] Gửi tin nhắn thất bại (${res.status}):`, await res.text());
    }
  } catch (err) {
    console.error("[lark-alert] Gửi tin nhắn thất bại:", err);
  }
}

/** Something failed — needs HR's attention. */
export async function sendLarkAlert(text: string): Promise<void> {
  await post(`⚠️ [Tuyển dụng] ${text}`);
}

/** Something worked — routine visibility into what the bot just did,
 * posted to the same group so it reads as one activity feed rather than
 * only ever hearing about failures. */
export async function sendLarkActivity(text: string): Promise<void> {
  await post(`✅ [Tuyển dụng] ${text}`);
}
