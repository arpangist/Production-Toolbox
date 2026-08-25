/// <reference lib="webworker" />
import type { WorkerInboundMessage, WorkerOutboundMessage } from "./types";
import type { ImageOpResult, ImageWorkerPayload, PaletteResult } from "./imageProcessing.types";
import { extractPalette } from "./paletteExtract";
import { applyDuotone, applyGrain } from "./pixelFilters";
import { renderFrame, renderGlitch, renderHalftone, renderLongShadow } from "./designEffects";

function post(message: WorkerOutboundMessage<unknown>) {
  (self as unknown as Worker).postMessage(message);
}

function getContext(canvas: OffscreenCanvas): OffscreenCanvasRenderingContext2D {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas context is not available.");
  return ctx;
}

self.onmessage = async (event: MessageEvent<WorkerInboundMessage<ImageWorkerPayload>>) => {
  const { taskId, payload } = event.data;

  try {
    post({ kind: "progress", taskId, progress: 0.1 });
    const bitmap = await createImageBitmap(payload.file);

    if (payload.op === "resize" || payload.op === "crop") {
      const canvas = new OffscreenCanvas(payload.width, payload.height);
      const ctx = getContext(canvas);

      if (payload.op === "resize") {
        if (payload.sourceRect) {
          const { x, y, width, height } = payload.sourceRect;
          ctx.drawImage(bitmap, x, y, width, height, 0, 0, payload.width, payload.height);
        } else {
          ctx.drawImage(bitmap, 0, 0, payload.width, payload.height);
        }
      } else {
        ctx.drawImage(
          bitmap,
          payload.x,
          payload.y,
          payload.width,
          payload.height,
          0,
          0,
          payload.width,
          payload.height,
        );
      }

      post({ kind: "progress", taskId, progress: 0.6 });
      const blob = await canvas.convertToBlob({ type: payload.format, quality: payload.quality });
      post({ kind: "progress", taskId, progress: 1 });
      post({
        kind: "result",
        taskId,
        result: { blob, width: payload.width, height: payload.height } satisfies ImageOpResult,
      });
      return;
    }

    if (payload.op === "encode") {
      let width = bitmap.width;
      let height = bitmap.height;
      if (payload.maxWidth && width > payload.maxWidth) {
        height = Math.round((height * payload.maxWidth) / width);
        width = payload.maxWidth;
      }

      const canvas = new OffscreenCanvas(width, height);
      const ctx = getContext(canvas);
      ctx.drawImage(bitmap, 0, 0, width, height);

      post({ kind: "progress", taskId, progress: 0.6 });
      const blob = await canvas.convertToBlob({ type: payload.format, quality: payload.quality });
      post({ kind: "progress", taskId, progress: 1 });
      post({ kind: "result", taskId, result: { blob, width, height } satisfies ImageOpResult });
      return;
    }

    if (payload.op === "palette") {
      const sampleSize = 100;
      const scale = Math.min(1, sampleSize / Math.max(bitmap.width, bitmap.height));
      const width = Math.max(1, Math.round(bitmap.width * scale));
      const height = Math.max(1, Math.round(bitmap.height * scale));

      const canvas = new OffscreenCanvas(width, height);
      const ctx = getContext(canvas);
      ctx.drawImage(bitmap, 0, 0, width, height);
      const { data } = ctx.getImageData(0, 0, width, height);

      post({ kind: "progress", taskId, progress: 0.6 });
      const colors = extractPalette(data, payload.colorCount);
      post({ kind: "progress", taskId, progress: 1 });
      post({ kind: "result", taskId, result: { colors } satisfies PaletteResult });
      return;
    }

    if (payload.op === "duotone" || payload.op === "grain") {
      const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
      const ctx = getContext(canvas);
      ctx.drawImage(bitmap, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      post({ kind: "progress", taskId, progress: 0.5 });
      if (payload.op === "duotone") {
        applyDuotone(imageData.data, payload.shadowColor, payload.highlightColor);
      } else {
        applyGrain(imageData.data, payload.amount, payload.monochrome);
      }
      ctx.putImageData(imageData, 0, 0);

      post({ kind: "progress", taskId, progress: 0.8 });
      const blob = await canvas.convertToBlob({ type: payload.format, quality: payload.quality });
      post({ kind: "progress", taskId, progress: 1 });
      post({
        kind: "result",
        taskId,
        result: { blob, width: canvas.width, height: canvas.height } satisfies ImageOpResult,
      });
      return;
    }

    if (payload.op === "frame" || payload.op === "longShadow" || payload.op === "halftone" || payload.op === "glitch") {
      post({ kind: "progress", taskId, progress: 0.4 });

      const canvas =
        payload.op === "frame"
          ? renderFrame(bitmap, payload)
          : payload.op === "longShadow"
            ? renderLongShadow(bitmap, payload)
            : payload.op === "halftone"
              ? renderHalftone(bitmap, payload)
              : renderGlitch(bitmap, payload);

      post({ kind: "progress", taskId, progress: 0.8 });
      const blob = await canvas.convertToBlob({ type: payload.format, quality: payload.quality });
      post({ kind: "progress", taskId, progress: 1 });
      post({
        kind: "result",
        taskId,
        result: { blob, width: canvas.width, height: canvas.height } satisfies ImageOpResult,
      });
    }
  } catch (error) {
    post({
      kind: "error",
      taskId,
      message: error instanceof Error ? error.message : "Image processing failed.",
    });
  }
};
