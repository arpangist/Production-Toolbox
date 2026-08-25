function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Couldn't read this image."));
    img.src = url;
  });
}

/** A coarse 8×8 average-hash (aHash): downscale to grayscale, threshold each
 * pixel against the mean. Similar images produce hashes with a small
 * Hamming distance — good enough for "possibly similar", not exact matching. */
export async function computeAverageHash(file: File, size = 8): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2D canvas context is not available.");
    ctx.drawImage(img, 0, 0, size, size);
    const { data } = ctx.getImageData(0, 0, size, size);

    const gray: number[] = [];
    for (let i = 0; i < data.length; i += 4) {
      gray.push((data[i] + data[i + 1] + data[i + 2]) / 3);
    }
    const avg = gray.reduce((a, b) => a + b, 0) / gray.length;
    return gray.map((v) => (v >= avg ? "1" : "0")).join("");
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function hammingDistance(a: string, b: string): number {
  let count = 0;
  for (let i = 0; i < a.length && i < b.length; i++) {
    if (a[i] !== b[i]) count++;
  }
  return count;
}
