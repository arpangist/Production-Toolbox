import type { FramePayload, GlitchPayload, HalftonePayload, LongShadowPayload } from "./imageProcessing.types";

function drawRoundedRect(ctx: OffscreenCanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

export function renderFrame(bitmap: ImageBitmap, payload: FramePayload): OffscreenCanvas {
  const totalPad = payload.outerPadding + payload.borderWidth + payload.innerPadding;
  const width = bitmap.width + totalPad * 2;
  const height = bitmap.height + totalPad * 2;
  const canvas = new OffscreenCanvas(Math.max(1, width), Math.max(1, height));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas context is not available.");

  if (!payload.transparentBackground) {
    ctx.fillStyle = payload.backgroundColor;
    ctx.fillRect(0, 0, width, height);
  }

  const frameX = payload.outerPadding;
  const frameY = payload.outerPadding;
  const frameW = width - payload.outerPadding * 2;
  const frameH = height - payload.outerPadding * 2;

  if (payload.shadow) {
    ctx.save();
    ctx.shadowColor = "rgba(17, 17, 17, 0.35)";
    ctx.shadowBlur = Math.max(8, payload.outerPadding * 0.6);
    ctx.shadowOffsetY = Math.max(4, payload.outerPadding * 0.2);
    ctx.fillStyle = payload.transparentBackground ? "#ffffff" : payload.backgroundColor;
    drawRoundedRect(ctx, frameX, frameY, frameW, frameH, payload.cornerRadius);
    ctx.fill();
    ctx.restore();
  }

  if (payload.borderWidth > 0) {
    ctx.save();
    ctx.strokeStyle = payload.borderColor;
    ctx.lineWidth = payload.borderWidth;
    if (payload.borderStyle === "dashed") ctx.setLineDash([payload.borderWidth * 3, payload.borderWidth * 2]);
    else if (payload.borderStyle === "dotted") ctx.setLineDash([payload.borderWidth, payload.borderWidth]);
    drawRoundedRect(
      ctx,
      frameX + payload.borderWidth / 2,
      frameY + payload.borderWidth / 2,
      frameW - payload.borderWidth,
      frameH - payload.borderWidth,
      payload.cornerRadius,
    );
    ctx.stroke();
    ctx.restore();
  }

  const imgX = frameX + payload.borderWidth + payload.innerPadding;
  const imgY = frameY + payload.borderWidth + payload.innerPadding;
  ctx.save();
  drawRoundedRect(ctx, imgX, imgY, bitmap.width, bitmap.height, Math.max(0, payload.cornerRadius - payload.borderWidth));
  ctx.clip();
  ctx.drawImage(bitmap, imgX, imgY);
  ctx.restore();

  return canvas;
}

export function renderLongShadow(bitmap: ImageBitmap, payload: LongShadowPayload): OffscreenCanvas {
  const radians = (payload.angle * Math.PI) / 180;
  const dx = Math.cos(radians);
  const dy = Math.sin(radians);
  const extentX = dx * payload.length;
  const extentY = dy * payload.length;

  const padLeft = Math.max(0, -extentX);
  const padTop = Math.max(0, -extentY);
  const padRight = Math.max(0, extentX);
  const padBottom = Math.max(0, extentY);
  const width = Math.max(1, Math.ceil(bitmap.width + padLeft + padRight));
  const height = Math.max(1, Math.ceil(bitmap.height + padTop + padBottom));

  const silhouette = new OffscreenCanvas(bitmap.width, bitmap.height);
  const sCtx = silhouette.getContext("2d");
  if (!sCtx) throw new Error("2D canvas context is not available.");
  sCtx.drawImage(bitmap, 0, 0);
  sCtx.globalCompositeOperation = "source-in";
  sCtx.fillStyle = payload.color;
  sCtx.fillRect(0, 0, bitmap.width, bitmap.height);

  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas context is not available.");

  const steps = Math.min(200, Math.max(1, Math.round(payload.length)));
  const stepSize = payload.length / steps;

  for (let i = steps; i >= 1; i--) {
    const dist = i * stepSize;
    const alpha = payload.opacity * (payload.fade ? 1 - i / steps : 1);
    if (alpha <= 0) continue;
    ctx.globalAlpha = alpha;
    ctx.drawImage(silhouette, padLeft + dx * dist, padTop + dy * dist);
  }

  ctx.globalAlpha = 1;
  ctx.drawImage(bitmap, padLeft, padTop);

  return canvas;
}

export function renderHalftone(bitmap: ImageBitmap, payload: HalftonePayload): OffscreenCanvas {
  const src = new OffscreenCanvas(bitmap.width, bitmap.height);
  const sctx = src.getContext("2d");
  if (!sctx) throw new Error("2D canvas context is not available.");
  sctx.drawImage(bitmap, 0, 0);
  const { data } = sctx.getImageData(0, 0, bitmap.width, bitmap.height);

  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas context is not available.");
  ctx.fillStyle = payload.backgroundColor;
  ctx.fillRect(0, 0, bitmap.width, bitmap.height);
  ctx.fillStyle = payload.dotColor;

  const radians = (payload.angle * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const cell = Math.max(3, payload.cellSize);
  const diag = Math.sqrt(bitmap.width ** 2 + bitmap.height ** 2);
  const halfW = bitmap.width / 2;
  const halfH = bitmap.height / 2;

  for (let gy = -diag; gy < diag; gy += cell) {
    for (let gx = -diag; gx < diag; gx += cell) {
      const x = gx * cos - gy * sin + halfW;
      const y = gx * sin + gy * cos + halfH;
      if (x < 0 || y < 0 || x >= bitmap.width || y >= bitmap.height) continue;

      const idx = (Math.floor(y) * bitmap.width + Math.floor(x)) * 4;
      const luminance = (data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114) / 255;
      const darkness = 1 - luminance;
      const maxRadius = (cell / 2) * 0.95;
      const radius = maxRadius * darkness;
      if (radius < 0.3) continue;

      if (payload.shape === "circle") {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      } else if (payload.shape === "square") {
        ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
      } else {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(radians);
        ctx.fillRect(-cell / 2, -radius / 2, cell * 0.9, Math.max(1, radius));
        ctx.restore();
      }
    }
  }

  return canvas;
}

function mulberry32(seed: number) {
  let state = seed;
  return function next() {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function renderGlitch(bitmap: ImageBitmap, payload: GlitchPayload): OffscreenCanvas {
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas context is not available.");
  const rand = mulberry32(payload.seed);

  ctx.drawImage(bitmap, 0, 0);

  if (payload.blockDisplace > 0) {
    const bandCount = 14;
    const bandHeight = Math.ceil(bitmap.height / bandCount);
    for (let i = 0; i < bandCount; i++) {
      const y = i * bandHeight;
      const h = Math.min(bandHeight, bitmap.height - y);
      if (h <= 0) continue;
      const shift = Math.round((rand() - 0.5) * 2 * payload.blockDisplace);
      if (shift === 0) continue;
      const bandData = ctx.getImageData(0, y, bitmap.width, h);
      ctx.clearRect(0, y, bitmap.width, h);
      ctx.putImageData(bandData, shift, y);
    }
  }

  if (payload.rgbShift > 0) {
    const base = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
    const output = ctx.createImageData(bitmap.width, bitmap.height);
    const shift = payload.rgbShift;
    for (let y = 0; y < bitmap.height; y++) {
      for (let x = 0; x < bitmap.width; x++) {
        const idx = (y * bitmap.width + x) * 4;
        const rX = Math.min(bitmap.width - 1, Math.max(0, x - shift));
        const bX = Math.min(bitmap.width - 1, Math.max(0, x + shift));
        const rIdx = (y * bitmap.width + rX) * 4;
        const bIdx = (y * bitmap.width + bX) * 4;
        output.data[idx] = base.data[rIdx];
        output.data[idx + 1] = base.data[idx + 1];
        output.data[idx + 2] = base.data[bIdx + 2];
        output.data[idx + 3] = base.data[idx + 3];
      }
    }
    ctx.putImageData(output, 0, 0);
  }

  if (payload.scanlineIntensity > 0) {
    ctx.fillStyle = `rgba(0, 0, 0, ${(payload.scanlineIntensity / 100) * 0.5})`;
    for (let y = 0; y < bitmap.height; y += 2) {
      ctx.fillRect(0, y, bitmap.width, 1);
    }
  }

  return canvas;
}
