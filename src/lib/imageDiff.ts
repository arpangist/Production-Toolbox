function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Couldn't load this image."));
    };
    img.src = url;
  });
}

export interface DiffResult {
  blob: Blob;
  diffPercent: number;
  width: number;
  height: number;
}

/** Scales both images to a shared canvas (image A's aspect ratio) and
 * highlights per-pixel absolute difference in red — a visual, not
 * semantic, comparison. */
export async function computeDifference(fileA: File, fileB: File, maxSize = 640): Promise<DiffResult> {
  const [imgA, imgB] = await Promise.all([loadImage(fileA), loadImage(fileB)]);

  const scale = Math.min(1, maxSize / Math.max(imgA.naturalWidth, imgA.naturalHeight));
  const width = Math.max(1, Math.round(imgA.naturalWidth * scale));
  const height = Math.max(1, Math.round(imgA.naturalHeight * scale));

  const canvasA = document.createElement("canvas");
  canvasA.width = width;
  canvasA.height = height;
  const ctxA = canvasA.getContext("2d");
  const canvasB = document.createElement("canvas");
  canvasB.width = width;
  canvasB.height = height;
  const ctxB = canvasB.getContext("2d");
  if (!ctxA || !ctxB) throw new Error("2D canvas context is not available.");

  ctxA.drawImage(imgA, 0, 0, width, height);
  ctxB.drawImage(imgB, 0, 0, width, height);

  const dataA = ctxA.getImageData(0, 0, width, height);
  const dataB = ctxB.getImageData(0, 0, width, height);
  const output = ctxA.createImageData(width, height);

  let diffPixels = 0;
  for (let i = 0; i < dataA.data.length; i += 4) {
    const magnitude = Math.min(
      255,
      Math.abs(dataA.data[i] - dataB.data[i]) + Math.abs(dataA.data[i + 1] - dataB.data[i + 1]) + Math.abs(dataA.data[i + 2] - dataB.data[i + 2]),
    );
    if (magnitude > 20) diffPixels++;
    output.data[i] = magnitude;
    output.data[i + 1] = 0;
    output.data[i + 2] = 0;
    output.data[i + 3] = 255;
  }

  const outCanvas = document.createElement("canvas");
  outCanvas.width = width;
  outCanvas.height = height;
  const outCtx = outCanvas.getContext("2d");
  if (!outCtx) throw new Error("2D canvas context is not available.");
  outCtx.putImageData(output, 0, 0);

  const blob = await new Promise<Blob>((resolve, reject) => {
    outCanvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Couldn't generate the difference image."))), "image/png");
  });

  return { blob, diffPercent: (diffPixels / (width * height)) * 100, width, height };
}
