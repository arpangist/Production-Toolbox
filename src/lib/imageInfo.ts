import type { ImageInfo } from "./preflight";

/** Reads dimensions and samples a downscaled canvas to detect transparency,
 * without ever loading the full-resolution pixel buffer on the main thread. */
export function readImageInfo(file: File): Promise<ImageInfo> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      const sampleSize = 64;
      const scale = Math.min(1, sampleSize / Math.max(image.naturalWidth, image.naturalHeight));
      const w = Math.max(1, Math.round(image.naturalWidth * scale));
      const h = Math.max(1, Math.round(image.naturalHeight * scale));

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      let hasTransparency = false;

      if (ctx) {
        ctx.drawImage(image, 0, 0, w, h);
        const { data } = ctx.getImageData(0, 0, w, h);
        for (let i = 3; i < data.length; i += 4) {
          if (data[i] < 255) {
            hasTransparency = true;
            break;
          }
        }
      }

      const info: ImageInfo = {
        width: image.naturalWidth,
        height: image.naturalHeight,
        type: file.type,
        size: file.size,
        hasTransparency,
      };
      URL.revokeObjectURL(url);
      resolve(info);
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Couldn't read this image."));
    };

    image.src = url;
  });
}
