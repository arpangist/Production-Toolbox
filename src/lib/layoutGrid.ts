export interface LayoutGridConfig {
  width: number;
  height: number;
  columns: number;
  gutter: number;
  margin: number;
  rows: number; // 0 disables row lines
  baseline: number; // 0 disables baseline grid
}

export interface LayoutGridPreset extends LayoutGridConfig {
  label: string;
}

export const LAYOUT_PRESETS: LayoutGridPreset[] = [
  { label: "12 Column", width: 1200, height: 800, columns: 12, gutter: 20, margin: 40, rows: 0, baseline: 0 },
  { label: "8 Column", width: 1200, height: 800, columns: 8, gutter: 24, margin: 40, rows: 0, baseline: 0 },
  { label: "Editorial", width: 1000, height: 1400, columns: 6, gutter: 16, margin: 64, rows: 0, baseline: 24 },
  { label: "Poster", width: 1080, height: 1620, columns: 4, gutter: 20, margin: 48, rows: 0, baseline: 0 },
  { label: "Web", width: 1440, height: 1024, columns: 12, gutter: 24, margin: 80, rows: 0, baseline: 0 },
  { label: "Social", width: 1080, height: 1080, columns: 4, gutter: 16, margin: 32, rows: 4, baseline: 0 },
];

export function paintLayoutGrid(ctx: CanvasRenderingContext2D, config: LayoutGridConfig) {
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, config.width, config.height);

  const contentW = config.width - config.margin * 2;
  const contentH = config.height - config.margin * 2;
  const colWidth = (contentW - config.gutter * (config.columns - 1)) / config.columns;

  ctx.fillStyle = "rgba(47, 95, 255, 0.12)";
  for (let i = 0; i < config.columns; i++) {
    const x = config.margin + i * (colWidth + config.gutter);
    ctx.fillRect(x, config.margin, colWidth, contentH);
  }

  ctx.strokeStyle = "rgba(47, 95, 255, 0.5)";
  ctx.lineWidth = 1;
  ctx.strokeRect(config.margin, config.margin, contentW, contentH);

  if (config.rows > 0) {
    const rowHeight = contentH / config.rows;
    ctx.strokeStyle = "rgba(255, 107, 107, 0.6)";
    for (let i = 1; i < config.rows; i++) {
      const y = config.margin + i * rowHeight;
      ctx.beginPath();
      ctx.moveTo(config.margin, y);
      ctx.lineTo(config.width - config.margin, y);
      ctx.stroke();
    }
  }

  if (config.baseline > 0) {
    ctx.strokeStyle = "rgba(17, 17, 17, 0.15)";
    for (let y = config.baseline; y < config.height; y += config.baseline) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(config.width, y);
      ctx.stroke();
    }
  }
}
