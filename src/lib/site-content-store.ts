import { promises as fs } from "fs";
import path from "path";
import {
  DEFAULT_SITE_CONTENT,
  JOB_EMPLOYMENT_TYPES,
  type JobItem,
  type LocationItem,
  type SiteContent,
} from "./site-content";

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;
const KV_KEY = "jimto:site_content";

const LOCAL_FILE = path.join(process.cwd(), ".data", "site-content.json");
const usingKv = Boolean(KV_URL && KV_TOKEN);

type StoredContent = Partial<Pick<SiteContent, "jobs" | "locations">>;

async function kvGet(): Promise<StoredContent | null> {
  const res = await fetch(`${KV_URL}/get/${KV_KEY}`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { result: string | null };
  return data.result ? (JSON.parse(data.result) as StoredContent) : null;
}

async function kvSet(content: StoredContent): Promise<void> {
  const res = await fetch(`${KV_URL}/set/${KV_KEY}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
    body: JSON.stringify(content),
  });
  if (!res.ok) {
    throw new Error(`Failed to write site content to KV store (${res.status})`);
  }
}

async function fileGet(): Promise<StoredContent | null> {
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
    return JSON.parse(raw) as StoredContent;
  } catch {
    return null;
  }
}

async function fileSet(content: StoredContent): Promise<void> {
  await fs.mkdir(path.dirname(LOCAL_FILE), { recursive: true });
  await fs.writeFile(LOCAL_FILE, JSON.stringify(content, null, 2), "utf-8");
}

async function readStored(): Promise<StoredContent | null> {
  return usingKv ? kvGet() : fileGet();
}

async function writeStored(patch: StoredContent): Promise<void> {
  const current = (await readStored()) ?? {};
  const next: StoredContent = { ...current, ...patch };
  if (usingKv) {
    await kvSet(next);
  } else {
    await fileSet(next);
  }
}

// Jobs saved before employmentType/location became multi-select are stored
// as plain free-text strings. Coerce those into arrays so old records don't
// crash `.map`/`.join` calls in the UI after the shape changed, and drop any
// value that isn't a currently known option — otherwise stale free text
// keeps riding along on every future save (it doesn't match any checkbox,
// so the admin form can never uncheck it) and shows up jumbled together
// with the real selections on the public site. A location stays "known"
// even while hidden, so hiding one never silently strips it off jobs that
// already use it — only deleting the location does that.
function toArray(value: unknown): string[] {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim() !== "") return [value];
  return [];
}

function normalizeJob(job: JobItem, knownLocationNames: string[]): JobItem {
  return {
    ...job,
    employmentType: toArray(job.employmentType).filter((t) =>
      JOB_EMPLOYMENT_TYPES.includes(t),
    ),
    location: toArray(job.location).filter((l) => knownLocationNames.includes(l)),
  };
}

// Only `jobs` and `locations` are editable from /admin, so only those come
// from storage. Everything else (hero, about, values, footer) always comes
// from site-content.ts, so editing that file and pushing actually shows up
// — otherwise a stored snapshot would shadow the code forever after the
// first save from /admin.
export async function getSiteContent(): Promise<SiteContent> {
  const stored = await readStored();
  const locations = stored?.locations ?? DEFAULT_SITE_CONTENT.locations;
  const knownLocationNames = locations.map((l) => l.name);
  const jobs = (stored?.jobs ?? DEFAULT_SITE_CONTENT.jobs).map((j) =>
    normalizeJob(j, knownLocationNames),
  );
  return { ...DEFAULT_SITE_CONTENT, jobs, locations };
}

export async function setJobs(jobs: JobItem[]): Promise<SiteContent> {
  await writeStored({ jobs });
  return getSiteContent();
}

export async function setLocations(locations: LocationItem[]): Promise<SiteContent> {
  await writeStored({ locations });
  return getSiteContent();
}
