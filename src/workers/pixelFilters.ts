function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  return [parseInt(clean.slice(0, 2), 16), parseInt(clean.slice(2, 4), 16), parseInt(clean.slice(4, 6), 16)];
}

function clamp255(value: number): number {
  return Math.min(255, Math.max(0, value));
}

export function applyDuotone(data: Uint8ClampedArray, shadowColor: string, highlightColor: string): void {
  const [sr, sg, sb] = hexToRgb(shadowColor);
  const [hr, hg, hb] = hexToRgb(highlightColor);

  for (let i = 0; i < data.length; i += 4) {
    const luminance = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
    data[i] = sr + (hr - sr) * luminance;
    data[i + 1] = sg + (hg - sg) * luminance;
    data[i + 2] = sb + (hb - sb) * luminance;
  }
}

export function applyGrain(data: Uint8ClampedArray, amount: number, monochrome: boolean): void {
  const intensity = (amount / 100) * 80;

  for (let i = 0; i < data.length; i += 4) {
    if (monochrome) {
      const noise = (Math.random() * 2 - 1) * intensity;
      data[i] = clamp255(data[i] + noise);
      data[i + 1] = clamp255(data[i + 1] + noise);
      data[i + 2] = clamp255(data[i + 2] + noise);
    } else {
      data[i] = clamp255(data[i] + (Math.random() * 2 - 1) * intensity);
      data[i + 1] = clamp255(data[i + 1] + (Math.random() * 2 - 1) * intensity);
      data[i + 2] = clamp255(data[i + 2] + (Math.random() * 2 - 1) * intensity);
    }
  }
}
