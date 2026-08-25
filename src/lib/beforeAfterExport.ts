export interface BeforeAfterConfig {
  mode: "side-by-side" | "split";
  dividerPercent: number;
  labelBefore: string;
  labelAfter: string;
  showLabels: boolean;
}

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

function drawLabel(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, align: "left" | "right" = "left") {
  ctx.font = "bold 20px sans-serif";
  const metrics = ctx.measureText(text);
  const paddingX = 10;
  const boxW = metrics.width + paddingX * 2;
  const boxH = 30;
  const boxX = align === "left" ? x : x - boxW;
  ctx.fillStyle = "rgba(17, 17, 17, 0.75)";
  ctx.fillRect(boxX, y, boxW, boxH);
  ctx.fillStyle = "#ffffff";
  ctx.textBaseline = "middle";
  ctx.fillText(text, boxX + paddingX, y + boxH / 2 + 1);
}

export async function renderBeforeAfter(fileA: File, fileB: File, config: BeforeAfterConfig): Promise<HTMLCanvasElement> {
  const [imgA, imgB] = await Promise.all([loadImage(fileA), loadImage(fileB)]);
  const canvas = document.createElement("canvas");
  const ctx = getContext(canvas);

  if (config.mode === "side-by-side") {
    const gap = 8;
    const h = Math.max(imgA.naturalHeight, imgB.naturalHeight);
    const wA = imgA.naturalWidth * (h / imgA.naturalHeight);
    const wB = imgB.naturalWidth * (h / imgB.naturalHeight);
    canvas.width = Math.round(wA + wB + gap);
    canvas.height = Math.round(h);

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imgA, 0, 0, wA, h);
    ctx.drawImage(imgB, wA + gap, 0, wB, h);

    if (config.showLabels) {
      drawLabel(ctx, config.labelBefore, 12, 12);
      drawLabel(ctx, config.labelAfter, wA + gap + 12, 12);
    }
  } else {
    const w = Math.max(imgA.naturalWidth, imgB.naturalWidth);
    const h = Math.max(imgA.naturalHeight, imgB.naturalHeight);
    canvas.width = w;
    canvas.height = h;

    ctx.drawImage(imgA, 0, 0, w, h);
    const splitX = (config.dividerPercent / 100) * w;
    ctx.save();
    ctx.beginPath();
    ctx.rect(splitX, 0, w - splitX, h);
    ctx.clip();
    ctx.drawImage(imgB, 0, 0, w, h);
    ctx.restore();

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(splitX, 0);
    ctx.lineTo(splitX, h);
    ctx.stroke();

    if (config.showLabels) {
      drawLabel(ctx, config.labelBefore, 12, 12);
      drawLabel(ctx, config.labelAfter, w - 12, 12, "right");
    }
  }

  return canvas;
}

function getContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas context is not available.");
  return ctx;
}
