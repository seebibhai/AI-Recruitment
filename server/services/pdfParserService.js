import fs from "fs/promises";
import pdfParse from "pdf-parse";

/**
 * Extracts raw text from a PDF file on disk.
 * Throws a descriptive error if the PDF cannot be parsed (e.g. scanned
 * image-only PDF with no text layer) so the caller can surface it cleanly.
 */
export async function extractTextFromPdf(filePath) {
  const buffer = await fs.readFile(filePath);
  const result = await pdfParse(buffer);

  const text = (result.text || "").trim();
  if (!text) {
    throw new Error(
      "No selectable text found in this PDF. It may be a scanned image without a text layer."
    );
  }
  return text;
}
