export type GradientType = "linear" | "radial" | "conic";

export interface GradientStop {
  id: string;
  color: string;
  position: number; // 0-100
}

export interface GradientConfig {
  type: GradientType;
  angle: number; // degrees, used by linear & conic
  centerX: number; // 0-100, used by radial & conic
  centerY: number; // 0-100
  stops: GradientStop[];
}

function sortedStops(stops: GradientStop[]): GradientStop[] {
  return [...stops].sort((a, b) => a.position - b.position);
}

function stopList(stops: GradientStop[]): string {
  return sortedStops(stops)
    .map((stop) => `${stop.color} ${stop.position}%`)
    .join(", ");
}

export function toCss(config: GradientConfig): string {
  const stops = stopList(config.stops);
  if (config.type === "linear") return `linear-gradient(${config.angle}deg, ${stops})`;
  if (config.type === "radial") return `radial-gradient(circle at ${config.centerX}% ${config.centerY}%, ${stops})`;
  return `conic-gradient(from ${config.angle}deg at ${config.centerX}% ${config.centerY}%, ${stops})`;
}

export function paintGradient(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, config: GradientConfig, width: number, height: number) {
  const stops = sortedStops(config.stops);
  let gradient: CanvasGradient;

  if (config.type === "linear") {
    const radians = (config.angle * Math.PI) / 180;
    const dx = Math.cos(radians);
    const dy = Math.sin(radians);
    const halfDiagonal = (Math.abs(dx) * width + Math.abs(dy) * height) / 2;
    const cx = width / 2;
    const cy = height / 2;
    gradient = ctx.createLinearGradient(cx - dx * halfDiagonal, cy - dy * halfDiagonal, cx + dx * halfDiagonal, cy + dy * halfDiagonal);
  } else if (config.type === "radial") {
    const cx = (config.centerX / 100) * width;
    const cy = (config.centerY / 100) * height;
    const radius = Math.max(width, height) * 0.75;
    gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  } else {
    const cx = (config.centerX / 100) * width;
    const cy = (config.centerY / 100) * height;
    const radians = (config.angle * Math.PI) / 180;
    gradient = (ctx as CanvasRenderingContext2D).createConicGradient(radians, cx, cy);
  }

  for (const stop of stops) {
    gradient.addColorStop(Math.min(1, Math.max(0, stop.position / 100)), stop.color);
  }

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

export function toSvg(config: GradientConfig, width: number, height: number): string {
  const stops = sortedStops(config.stops)
    .map((stop) => `<stop offset="${stop.position}%" stop-color="${stop.color}" />`)
    .join("");

  let def: string;
  if (config.type === "radial") {
    def = `<radialGradient id="g" cx="${config.centerX}%" cy="${config.centerY}%" r="75%">${stops}</radialGradient>`;
  } else {
    // SVG has no native conic gradient — linear is used as the closest
    // portable approximation for export.
    const radians = (config.angle * Math.PI) / 180;
    const x2 = 50 + Math.cos(radians) * 50;
    const y2 = 50 + Math.sin(radians) * 50;
    const x1 = 100 - x2;
    const y1 = 100 - y2;
    def = `<linearGradient id="g" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%">${stops}</linearGradient>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>${def}</defs>
  <rect width="${width}" height="${height}" fill="url(#g)" />
</svg>`;
}

let idCounter = 0;
export function nextStopId(): string {
  idCounter += 1;
  return `stop-${idCounter}-${Date.now()}`;
}
