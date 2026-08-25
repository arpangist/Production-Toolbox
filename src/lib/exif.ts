export interface ExifData {
  make?: string;
  model?: string;
  dateTime?: string;
  orientation?: number;
}

const ASCII_TAGS: Record<number, keyof ExifData> = {
  0x010f: "make",
  0x0110: "model",
  0x0132: "dateTime",
};
const SHORT_TAGS: Record<number, keyof ExifData> = {
  0x0112: "orientation",
};

function parseTiff(view: DataView, tiffStart: number): ExifData {
  const littleEndian = view.getUint16(tiffStart) === 0x4949;
  const ifdOffset = view.getUint32(tiffStart + 4, littleEndian);
  const result: ExifData = {};
  const entryCount = view.getUint16(tiffStart + ifdOffset, littleEndian);

  for (let i = 0; i < entryCount; i++) {
    const entryOffset = tiffStart + ifdOffset + 2 + i * 12;
    if (entryOffset + 12 > view.byteLength) break;

    const tag = view.getUint16(entryOffset, littleEndian);
    const type = view.getUint16(entryOffset + 2, littleEndian);
    const count = view.getUint32(entryOffset + 4, littleEndian);
    const valueOffset = entryOffset + 8;

    if (type === 2 && ASCII_TAGS[tag]) {
      const strOffset = count > 4 ? tiffStart + view.getUint32(valueOffset, littleEndian) : valueOffset;
      let str = "";
      for (let j = 0; j < count - 1 && strOffset + j < view.byteLength; j++) {
        str += String.fromCharCode(view.getUint8(strOffset + j));
      }
      result[ASCII_TAGS[tag]] = str as never;
    } else if (type === 3 && SHORT_TAGS[tag]) {
      result[SHORT_TAGS[tag]] = view.getUint16(valueOffset, littleEndian) as never;
    }
  }
  return result;
}

/** Reads only what's actually present in the JPEG's EXIF (APP1) segment —
 * returns null for non-JPEGs or files with no EXIF data, never invents values. */
export async function readExif(file: File): Promise<ExifData | null> {
  if (file.type !== "image/jpeg") return null;

  const buffer = await file.slice(0, 256 * 1024).arrayBuffer();
  const view = new DataView(buffer);
  if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return null;

  let offset = 2;
  while (offset + 4 <= view.byteLength) {
    const marker = view.getUint16(offset);
    if ((marker & 0xff00) !== 0xff00) break;
    if (marker === 0xffda) break; // start of scan — no more metadata markers

    const length = view.getUint16(offset + 2);
    if (marker === 0xffe1 && offset + 4 + 6 <= view.byteLength && view.getUint32(offset + 4) === 0x45786966) {
      try {
        return parseTiff(view, offset + 4 + 6);
      } catch {
        return null;
      }
    }
    offset += 2 + length;
  }
  return null;
}
