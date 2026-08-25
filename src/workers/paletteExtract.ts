import type { PaletteColor } from "./imageProcessing.types";

interface RGB {
  r: number;
  g: number;
  b: number;
}

function channelRange(bucket: RGB[], channel: keyof RGB): number {
  let min = 255;
  let max = 0;
  for (const pixel of bucket) {
    const value = pixel[channel];
    if (value < min) min = value;
    if (value > max) max = value;
  }
  return max - min;
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;

  if (d === 0) return [0, 0, Math.round(l * 100)];

  const s = d / (1 - Math.abs(2 * l - 1));
  let h: number;
  if (max === rn) h = ((gn - bn) / d) % 6;
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  h *= 60;
  if (h < 0) h += 360;

  return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
}

/** Median-cut color quantization: splits pixels into `colorCount` buckets
 * by repeatedly halving the bucket with the widest channel range. */
export function extractPalette(data: Uint8ClampedArray, colorCount: number): PaletteColor[] {
  const pixels: RGB[] = [];
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue; // skip transparent pixels
    pixels.push({ r: data[i], g: data[i + 1], b: data[i + 2] });
  }
  if (pixels.length === 0) return [];

  let buckets: RGB[][] = [pixels];

  while (buckets.length < colorCount) {
    let targetIndex = 0;
    let targetChannel: keyof RGB = "r";
    let largestRange = -1;

    buckets.forEach((bucket, index) => {
      (["r", "g", "b"] as const).forEach((channel) => {
        const range = channelRange(bucket, channel);
        if (range > largestRange) {
          largestRange = range;
          targetIndex = index;
          targetChannel = channel;
        }
      });
    });

    const bucket = buckets[targetIndex];
    if (bucket.length <= 1 || largestRange === 0) break;

    bucket.sort((a, b) => a[targetChannel] - b[targetChannel]);
    const mid = Math.floor(bucket.length / 2);
    buckets.splice(targetIndex, 1, bucket.slice(0, mid), bucket.slice(mid));
  }

  return buckets
    .filter((bucket) => bucket.length > 0)
    .map((bucket) => {
      const sum = bucket.reduce(
        (acc, p) => ({ r: acc.r + p.r, g: acc.g + p.g, b: acc.b + p.b }),
        { r: 0, g: 0, b: 0 },
      );
      const r = Math.round(sum.r / bucket.length);
      const g = Math.round(sum.g / bucket.length);
      const b = Math.round(sum.b / bucket.length);
      return { hex: rgbToHex(r, g, b), rgb: [r, g, b] as [number, number, number], hsl: rgbToHsl(r, g, b), population: bucket.length };
    })
    .sort((a, b) => b.population - a.population);
}
