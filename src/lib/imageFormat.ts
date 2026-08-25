import type { ImageFormat } from "../workers/imageProcessing.types";

export const FORMAT_LABELS: Record<ImageFormat, string> = {
  "image/jpeg": "JPEG",
  "image/png": "PNG",
  "image/webp": "WebP",
  "image/avif": "AVIF",
};

const FORMAT_EXTENSIONS: Record<ImageFormat, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

export function extensionForFormat(format: ImageFormat): string {
  return `.${FORMAT_EXTENSIONS[format]}`;
}

export function withExtension(filename: string, format: ImageFormat): string {
  const base = filename.replace(/\.[^./]+$/, "");
  return `${base}${extensionForFormat(format)}`;
}

export function supportsQuality(format: ImageFormat): boolean {
  return format === "image/jpeg" || format === "image/webp" || format === "image/avif";
}

let avifSupportPromise: Promise<boolean> | null = null;

/** AVIF encoding support varies by browser — detected once and cached. */
export function supportsAvifEncoding(): Promise<boolean> {
  if (!avifSupportPromise) {
    avifSupportPromise = new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = 1;
      canvas.toBlob((blob) => resolve(!!blob && blob.type === "image/avif"), "image/avif");
    });
  }
  return avifSupportPromise;
}
