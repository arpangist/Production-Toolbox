export type EstimateImageFormat = "jpeg" | "png" | "webp";

/** Rough bytes-per-pixel heuristics — real compressed size depends heavily
 * on image content, so these are estimates only, clearly labeled as such. */
export function estimateImageBytes(width: number, height: number, format: EstimateImageFormat, quality: number): number {
  const pixels = Math.max(0, width) * Math.max(0, height);
  if (format === "png") return Math.round(pixels * 1.5);
  const bppJpeg = 0.02 + (quality / 100) * 0.22;
  const bpp = format === "webp" ? bppJpeg * 0.7 : bppJpeg;
  return Math.round(pixels * bpp);
}

export function estimateVideoBytes(durationSeconds: number, videoBitrateKbps: number, audioBitrateKbps: number): number {
  const totalKbps = Math.max(0, videoBitrateKbps) + Math.max(0, audioBitrateKbps);
  return Math.round((totalKbps * 1000 * Math.max(0, durationSeconds)) / 8);
}
