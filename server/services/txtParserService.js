import fs from "fs/promises";

export async function extractTextFromTxt(filePath) {
  const text = (await fs.readFile(filePath, "utf-8")).trim();
  if (!text) {
    throw new Error("The uploaded text file is empty.");
  }
  return text;
}
