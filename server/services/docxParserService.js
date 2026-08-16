import mammoth from "mammoth";

/**
 * Extracts raw text from a DOCX file on disk using mammoth.
 */
export async function extractTextFromDocx(filePath) {
  const result = await mammoth.extractRawText({ path: filePath });
  const text = (result.value || "").trim();

  if (!text) {
    throw new Error("No readable text found in this DOCX file.");
  }
  return text;
}
