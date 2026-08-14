import { promises as fs } from "fs";
import path from "path";
import { DEFAULT_SITE_CONTENT, type JobItem, type SiteContent } from "./site-content";

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;
const KV_KEY = "jimto:site_content";

const LOCAL_FILE = path.join(process.cwd(), ".data", "site-content.json");
const usingKv = Boolean(KV_URL && KV_TOKEN);

async function kvGet(): Promise<SiteContent | null> {
  const res = await fetch(`${KV_URL}/get/${KV_KEY}`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { result: string | null };
  return data.result ? (JSON.parse(data.result) as SiteContent) : null;
}

async function kvSet(content: SiteContent): Promise<void> {
  const res = await fetch(`${KV_URL}/set/${KV_KEY}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
    body: JSON.stringify(content),
  });
  if (!res.ok) {
    throw new Error(`Failed to write site content to KV store (${res.status})`);
  }
}

async function fileGet(): Promise<SiteContent | null> {
  if (process.env.NODE_ENV === "production") {
    // No KV configured and we're on a real deployment — the local filesystem
    // here is not persistent/writable (e.g. Vercel serverless functions).
    console.error(
      "[site-content-store] KV_REST_API_URL / KV_REST_API_TOKEN are not set in production. " +
        "Admin edits will not persist. See DEPLOY.md.",
    );
    return null;
  }
  try {
    const raw = await fs.readFile(LOCAL_FILE, "utf-8");
    return JSON.parse(raw) as SiteContent;
  } catch {
    return null;
  }
}

async function fileSet(content: SiteContent): Promise<void> {
  await fs.mkdir(path.dirname(LOCAL_FILE), { recursive: true });
  await fs.writeFile(LOCAL_FILE, JSON.stringify(content, null, 2), "utf-8");
}

export async function getSiteContent(): Promise<SiteContent> {
  const stored = usingKv ? await kvGet() : await fileGet();
  return stored ?? DEFAULT_SITE_CONTENT;
}

export async function setJobs(jobs: JobItem[]): Promise<SiteContent> {
  const current = await getSiteContent();
  const next: SiteContent = { ...current, jobs };
  if (usingKv) {
    await kvSet(next);
  } else {
    await fileSet(next);
  }
  return next;
}
