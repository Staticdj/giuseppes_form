import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

const PDF_STORAGE_DIR =
  process.env.PDF_STORAGE_DIR ??
  path.join(process.cwd(), "storage", "pdfs");

/**
 * Persist a PDF buffer to local file storage.
 * Returns the storage key (filename) that can be used to retrieve it later.
 * Swap this implementation for S3/cloud storage without changing callers.
 */
export async function storePdf(
  buffer: Buffer,
  reportId: string
): Promise<string> {
  await fs.promises.mkdir(PDF_STORAGE_DIR, { recursive: true });
  const key = `report-${reportId}-${randomUUID()}.pdf`;
  const filePath = path.join(PDF_STORAGE_DIR, key);
  await fs.promises.writeFile(filePath, buffer);
  return key;
}

/**
 * Retrieve a previously stored PDF by storage key.
 */
export async function retrievePdf(storageKey: string): Promise<Buffer> {
  const filePath = path.join(PDF_STORAGE_DIR, storageKey);
  return fs.promises.readFile(filePath);
}

/**
 * Check whether a stored PDF exists.
 */
export async function pdfExists(storageKey: string): Promise<boolean> {
  const filePath = path.join(PDF_STORAGE_DIR, storageKey);
  try {
    await fs.promises.access(filePath, fs.constants.R_OK);
    return true;
  } catch {
    return false;
  }
}
