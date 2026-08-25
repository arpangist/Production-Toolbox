import { seekTo } from "./video";

export interface Shot {
  start: number;
  end: number;
}

export interface CutDetectionResult {
  shots: Shot[];
  cutTimestamps: number[];
}

export interface CutDetectionOptions {
  sampleInterval: number; // seconds between sampled frames
  threshold: number; // 0-255 average per-channel difference to flag a cut
  maxSamples?: number;
}

/** Deterministic shot-boundary detection: samples frames at a fixed
 * interval, downscales each to a tiny grayscale grid, and flags a cut
 * wherever the average pixel difference between consecutive samples
 * exceeds the threshold. No semantic understanding — just frame deltas. */
export async function detectCuts(
  video: HTMLVideoElement,
  duration: number,
  options: CutDetectionOptions,
  onProgress?: (progress: number) => void,
): Promise<CutDetectionResult> {
  const sampleSize = 32;
  const canvas = document.createElement("canvas");
  canvas.width = sampleSize;
  canvas.height = sampleSize;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas context is not available.");

  const maxSamples = options.maxSamples ?? 400;
  const effectiveInterval = Math.max(options.sampleInterval, duration / maxSamples);
  const sampleCount = Math.max(2, Math.floor(duration / effectiveInterval));

  let prevData: Uint8ClampedArray | null = null;
  const cutTimestamps: number[] = [];

  for (let i = 0; i < sampleCount; i++) {
    const t = i * effectiveInterval;
    await seekTo(video, t);
    ctx.drawImage(video, 0, 0, sampleSize, sampleSize);
    const { data } = ctx.getImageData(0, 0, sampleSize, sampleSize);

    if (prevData) {
      let diff = 0;
      for (let p = 0; p < data.length; p += 4) {
        diff += Math.abs(data[p] - prevData[p]) + Math.abs(data[p + 1] - prevData[p + 1]) + Math.abs(data[p + 2] - prevData[p + 2]);
      }
      const avgDiff = diff / (sampleSize * sampleSize * 3);
      if (avgDiff > options.threshold) cutTimestamps.push(t);
    }

    prevData = data;
    onProgress?.((i + 1) / sampleCount);
  }

  const shots: Shot[] = [];
  let shotStart = 0;
  for (const cut of cutTimestamps) {
    if (cut - shotStart > 0.05) shots.push({ start: shotStart, end: cut });
    shotStart = cut;
  }
  shots.push({ start: shotStart, end: duration });

  return { shots, cutTimestamps };
}
