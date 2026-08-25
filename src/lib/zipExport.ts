import { zip, type Zippable } from "fflate";
import { downloadBlob } from "./downloadFile";

export interface ZipEntry {
  name: string;
  data: Uint8Array;
}

export function buildZip(entries: ZipEntry[]): Promise<Uint8Array> {
  const input: Zippable = {};
  for (const entry of entries) input[entry.name] = entry.data;

  return new Promise((resolve, reject) => {
    zip(input, { level: 6 }, (error, data) => {
      if (error) reject(error);
      else resolve(data);
    });
  });
}

export async function downloadAsZip(entries: ZipEntry[], filename: string): Promise<void> {
  const zipped = await buildZip(entries);
  downloadBlob(new Blob([zipped as BlobPart], { type: "application/zip" }), filename);
}
