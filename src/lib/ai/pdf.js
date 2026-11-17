// Server-side resume PDF validation and text extraction (unpdf: pure JS, no native deps).
import { extractText, getDocumentProxy } from "unpdf";

export const MAX_PDF_BYTES = 5 * 1024 * 1024;
export const INVALID_FILE_MSG = "Please upload a valid PDF resume (up to 5 MB) that contains selectable text.";

/**
 * Checks MIME type (when given), size (<= 5 MB), %PDF magic bytes, then extracts text.
 * @returns {Promise<{ text: string } | { error: string, code: "INVALID_FILE" }>}
 */
export async function validateAndExtractPdf(base64, mimeType) {
  const bad = (error = INVALID_FILE_MSG) => ({ error, code: "INVALID_FILE" });
  if (mimeType !== undefined && mimeType !== null && mimeType !== "application/pdf") return bad();
  if (typeof base64 !== "string" || !base64) return bad();
  const b64 = base64.replace(/^data:[^,]*,/, "").replace(/\s+/g, "");
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(b64)) return bad();
  // Decoded size estimate before allocating anything large.
  const approx = Math.floor((b64.length * 3) / 4);
  if (approx > MAX_PDF_BYTES + 3) return bad("That file is larger than 5 MB. Please upload a smaller PDF.");
  const buf = Buffer.from(b64, "base64");
  if (buf.length > MAX_PDF_BYTES) return bad("That file is larger than 5 MB. Please upload a smaller PDF.");
  if (buf.length < 5 || buf.subarray(0, 5).toString("latin1") !== "%PDF-") return bad();
  try {
    const pdf = await getDocumentProxy(new Uint8Array(buf));
    const { text } = await extractText(pdf, { mergePages: true });
    const t = String(text ?? "").trim();
    if (t.length < 50) return bad("We couldn't read any text in that PDF. Please upload a text-based (not scanned) resume.");
    return { text: t };
  } catch {
    return bad();
  }
}
