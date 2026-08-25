import { computeCoverRect } from "./coverCrop";
import { buildFileName, type RenameFields } from "./batchRename";
import { extensionForFormat, withExtension } from "./imageFormat";
import type { ImageFormat, ImageOpResult } from "../workers/imageProcessing.types";
import type { WorkerPool } from "../workers/workerPool";

const KNOWN_FORMATS: ImageFormat[] = ["image/jpeg", "image/png", "image/webp"];

export interface ResizeStep {
  enabled: boolean;
  width: number;
  height: number;
  mode: "fit" | "fill";
}

export interface FormatStep {
  enabled: boolean;
  format: ImageFormat;
  quality: number;
}

export interface RenameStep {
  enabled: boolean;
  fields: RenameFields;
}

export type StepKey = "resize" | "format" | "rename";

export interface PipelineConfig {
  order: StepKey[];
  resize: ResizeStep;
  format: FormatStep;
  rename: RenameStep;
}

export interface PipelineOutput {
  originalFile: File;
  blob: Blob;
  name: string;
}

async function applyResize(
  pool: WorkerPool,
  file: File,
  step: ResizeStep,
  outputFormat: ImageFormat,
  quality: number,
): Promise<ImageOpResult> {
  const bitmap = await createImageBitmap(file);
  const srcW = bitmap.width;
  const srcH = bitmap.height;
  bitmap.close();

  if (step.mode === "fill") {
    const sourceRect = computeCoverRect(srcW, srcH, step.width, step.height);
    return pool.run<ImageOpResult>({
      op: "resize",
      file,
      width: step.width,
      height: step.height,
      sourceRect,
      format: outputFormat,
      quality,
    }).promise;
  }

  const scale = Math.min(step.width / srcW, step.height / srcH, 1);
  const width = Math.max(1, Math.round(srcW * scale));
  const height = Math.max(1, Math.round(srcH * scale));
  return pool.run<ImageOpResult>({ op: "resize", file, width, height, format: outputFormat, quality }).promise;
}

/** Runs the enabled steps, in order, for one file — each step's output blob
 * becomes the next step's input file, chaining the same worker ops every
 * other image tool uses individually. The output filename's extension is
 * kept in sync with whatever format the pipeline actually produced, so a
 * PNG converted to JPEG never gets downloaded as a mislabeled ".png". */
export async function runPipelineForFile(
  pool: WorkerPool,
  file: File,
  config: PipelineConfig,
  index: number,
): Promise<PipelineOutput> {
  let current = file;
  let currentFormat: ImageFormat = KNOWN_FORMATS.includes(file.type as ImageFormat) ? (file.type as ImageFormat) : "image/jpeg";
  let renamedTo: string | null = null;

  for (const key of config.order) {
    if (key === "resize" && config.resize.enabled) {
      const result = await applyResize(pool, current, config.resize, currentFormat, 0.92);
      current = new File([result.blob], withExtension(current.name, currentFormat), { type: result.blob.type });
    } else if (key === "format" && config.format.enabled) {
      const result = await pool.run<ImageOpResult>({
        op: "encode",
        file: current,
        format: config.format.format,
        quality: config.format.quality / 100,
      }).promise;
      currentFormat = config.format.format;
      current = new File([result.blob], withExtension(current.name, currentFormat), { type: result.blob.type });
    } else if (key === "rename" && config.rename.enabled) {
      renamedTo = buildFileName(file.name, index, config.rename.fields, extensionForFormat(currentFormat));
    }
  }

  // Steps are user-reorderable, so Rename may have run before a later
  // format change — re-normalize the extension against the final format.
  const finalName = renamedTo ? withExtension(renamedTo, currentFormat) : current.name;
  return { originalFile: file, blob: current, name: finalName };
}
