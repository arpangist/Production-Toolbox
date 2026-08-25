export type PerspectiveType = "1-point" | "2-point" | "3-point";

export interface VanishingPoint {
  x: number; // 0-100 percent
  y: number;
}

export interface PerspectiveConfig {
  type: PerspectiveType;
  vp1: VanishingPoint;
  vp2: VanishingPoint;
  vp3: VanishingPoint;
  density: number;
  lineOpacity: number;
}

function activePoints(config: PerspectiveConfig): VanishingPoint[] {
  if (config.type === "1-point") return [config.vp1];
  if (config.type === "2-point") return [config.vp1, config.vp2];
  return [config.vp1, config.vp2, config.vp3];
}

export function paintPerspectiveGrid(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  config: PerspectiveConfig,
  width: number,
  height: number,
) {
  ctx.fillStyle = "#f7f7f5";
  ctx.fillRect(0, 0, width, height);

  const diag = Math.sqrt(width ** 2 + height ** 2);
  ctx.strokeStyle = `rgba(17, 17, 17, ${config.lineOpacity / 100})`;
  ctx.lineWidth = 1;

  const points = activePoints(config).map((vp) => ({ x: (vp.x / 100) * width, y: (vp.y / 100) * height }));

  for (const point of points) {
    for (let i = 0; i < config.density; i++) {
      const angle = (i / config.density) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
      ctx.lineTo(point.x + Math.cos(angle) * diag, point.y + Math.sin(angle) * diag);
      ctx.stroke();
    }
  }

  ctx.fillStyle = "#2f5fff";
  for (const point of points) {
    ctx.beginPath();
    ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function perspectiveGridToSvg(config: PerspectiveConfig, width: number, height: number): string {
  const diag = Math.sqrt(width ** 2 + height ** 2);
  const points = activePoints(config).map((vp) => ({ x: (vp.x / 100) * width, y: (vp.y / 100) * height }));

  const lines: string[] = [];
  for (const point of points) {
    for (let i = 0; i < config.density; i++) {
      const angle = (i / config.density) * Math.PI * 2;
      const x2 = point.x + Math.cos(angle) * diag;
      const y2 = point.y + Math.sin(angle) * diag;
      lines.push(`<line x1="${point.x.toFixed(1)}" y1="${point.y.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="rgba(17,17,17,${config.lineOpacity / 100})" />`);
    }
  }
  const dots = points.map((p) => `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4" fill="#2f5fff" />`).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="#f7f7f5" />
  ${lines.join("\n  ")}
  ${dots}
</svg>`;
}
