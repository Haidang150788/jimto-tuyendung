import { inflateSync } from "node:zlib";

const EMAIL_RE = /[a-zA-Z0-9.\-+_]+@[a-zA-Z0-9\-]+\.[a-zA-Z0-9\-.]+/;

function firstEmail(text: string): string | null {
  return text.match(EMAIL_RE)?.[0] ?? null;
}

// pdf-parse (via pdfjs-dist) crashed with "DOMMatrix is not defined" on
// Vercel's serverless runtime even for plain text extraction — worked
// locally, broke in production, and pdfjs-dist is heavy for what we
// actually need (find an email-looking string, not accurate layout). This
// instead pulls every `stream…endstream` block, inflates it (PDF content
// streams are almost always FlateDecode — zlib is a Node builtin, no
// dependency), and regex-scans the result. PDF text-show operators wrap
// visible text in literal "(...)" strings, so a plain-ASCII email survives
// this as readable text; only PDFs using hex-encoded strings or embedded
// custom font encodings (rare for CVs) would defeat it — acceptable for a
// best-effort fallback that already degrades to "ask the candidate".
function extractPdfText(buffer: Buffer): string {
  const raw = buffer.toString("latin1");
  const streamRe = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let text = "";
  let match: RegExpExecArray | null;
  while ((match = streamRe.exec(raw))) {
    const bytes = Buffer.from(match[1], "latin1");
    try {
      text += inflateSync(bytes).toString("latin1");
    } catch {
      text += bytes.toString("latin1");
    }
    text += "\n";
  }
  return text;
}

// .docx is a zip of XML parts; visible text lives in <w:t> runs inside
// word/document.xml. jszip is a pure-JS zip reader (no native deps, no
// DOM), so this avoids repeating the pdf-parse situation.
async function extractDocxText(buffer: Buffer): Promise<string> {
  const { default: JSZip } = await import("jszip");
  const zip = await JSZip.loadAsync(buffer);
  const xml = await zip.file("word/document.xml")?.async("string");
  if (!xml) return "";
  return Array.from(xml.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g))
    .map((m) => m[1])
    .join(" ");
}

// Office positions require an email (see ApplicationSubmission) but many
// candidates only bother filling it into their CV, not the form field —
// this recovers it from the uploaded file so the submission isn't rejected
// over a field they arguably already answered.
export async function extractEmailFromCv(file: File): Promise<string | null> {
  const name = file.name.toLowerCase();

  try {
    const buffer = Buffer.from(await file.arrayBuffer());

    if (name.endsWith(".pdf")) return firstEmail(extractPdfText(buffer));
    if (name.endsWith(".docx")) return firstEmail(await extractDocxText(buffer));
    // Legacy .doc (binary OLE) — no lightweight pure-JS parser available;
    // a plain-text address is still recoverable often enough from a raw
    // latin1 scan of the bytes to be worth trying as a last resort.
    return firstEmail(buffer.toString("latin1"));
  } catch (err) {
    console.error("[extract-email-from-cv] Failed to parse CV:", err);
    return null;
  }
}
