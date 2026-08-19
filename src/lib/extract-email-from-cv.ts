import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

const EMAIL_RE = /[a-zA-Z0-9.\-+_]+@[a-zA-Z0-9\-]+\.[a-zA-Z0-9\-.]+/;

function firstEmail(text: string): string | null {
  return text.match(EMAIL_RE)?.[0] ?? null;
}

// Office positions require an email (see ApplicationSubmission) but many
// candidates only bother filling it into their CV, not the form field —
// this recovers it from the uploaded file so the submission isn't rejected
// over a field they arguably already answered.
export async function extractEmailFromCv(file: File): Promise<string | null> {
  const name = file.name.toLowerCase();

  try {
    const buffer = Buffer.from(await file.arrayBuffer());

    if (name.endsWith(".pdf")) {
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      await parser.destroy();
      return firstEmail(result.text);
    }
    if (name.endsWith(".docx")) {
      const result = await mammoth.extractRawText({ buffer });
      return firstEmail(result.value);
    }
    // Legacy .doc (binary OLE) — no lightweight pure-JS parser available;
    // a plain-text address is still recoverable often enough from a raw
    // latin1 scan of the bytes to be worth trying as a last resort.
    return firstEmail(buffer.toString("latin1"));
  } catch (err) {
    console.error("[extract-email-from-cv] Failed to parse CV:", err);
    return null;
  }
}
