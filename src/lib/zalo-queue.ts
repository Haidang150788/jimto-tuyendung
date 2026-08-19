// FIFO queue for candidate-facing Zalo notifications, backed by the same
// Upstash-compatible KV store used for site content. Lark Automation pushes
// a job here when HR changes a candidate's status; the always-on Zalo bot
// (a separate Node process, not part of this Next.js app — see
// ZALO_AUTOMATION.md) polls and drains it.

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;
const QUEUE_KEY = "jimto:zalo_queue";
const usingKv = Boolean(KV_URL && KV_TOKEN);

// Dev-only fallback so this is testable without provisioning KV locally.
// Not persisted across restarts — fine, since production always has KV
// configured (it's already required for /admin to work at all).
const memoryQueue: string[] = [];

export interface ZaloNotifyJob {
  type: "interview" | "reject" | "offer";
  phone: string;
  name: string;
  position: string;
  details?: string;
}

async function redisCmd(...args: string[]): Promise<unknown> {
  const url = `${KV_URL}/${args.map(encodeURIComponent).join("/")}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Redis command failed (${res.status})`);
  }
  const data = (await res.json()) as { result: unknown };
  return data.result;
}

export async function pushZaloJob(job: ZaloNotifyJob): Promise<void> {
  const serialized = JSON.stringify(job);
  if (usingKv) {
    await redisCmd("rpush", QUEUE_KEY, serialized);
  } else {
    memoryQueue.push(serialized);
  }
}

export async function popZaloJob(): Promise<ZaloNotifyJob | null> {
  const serialized = usingKv ? await redisCmd("lpop", QUEUE_KEY) : memoryQueue.shift();
  if (!serialized || typeof serialized !== "string") return null;
  return JSON.parse(serialized) as ZaloNotifyJob;
}
