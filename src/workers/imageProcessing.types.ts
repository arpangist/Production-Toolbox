export type ImageFormat = "image/jpeg" | "image/png" | "image/webp" | "image/avif";

interface BasePayload {
  file: File;
  format: ImageFormat;
  quality: number;
}

export interface SourceRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ResizePayload extends BasePayload {
  op: "resize";
  width: number;
  height: number;
  /** When set, this source-image region is cropped and scaled to fill
   * width×height exactly, instead of stretching the whole source image. */
  sourceRect?: SourceRect;
}

export interface CropPayload extends BasePayload {
  op: "crop";
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface EncodePayload extends BasePayload {
  op: "encode";
  maxWidth?: number;
}

export interface PalettePayload {
  op: "palette";
  file: File;
  colorCount: number;
}

export interface DuotonePayload extends BasePayload {
  op: "duotone";
  shadowColor: string;
  highlightColor: string;
}

export interface GrainPayload extends BasePayload {
  op: "grain";
  amount: number; // 0-100
  monochrome: boolean;
}

export type BorderStyle = "solid" | "dashed" | "dotted";

export interface FramePayload extends BasePayload {
  op: "frame";
  outerPadding: number;
  innerPadding: number;
  borderWidth: number;
  borderColor: string;
  borderStyle: BorderStyle;
  cornerRadius: number;
  shadow: boolean;
  backgroundColor: string;
  transparentBackground: boolean;
}

export interface LongShadowPayload extends BasePayload {
  op: "longShadow";
  angle: number; // degrees
  length: number; // px
  opacity: number; // 0-1
  color: string;
  fade: boolean;
}

export interface HalftonePayload extends BasePayload {
  op: "halftone";
  cellSize: number;
  angle: number;
  shape: "circle" | "square" | "line";
  backgroundColor: string;
  dotColor: string;
}

export interface GlitchPayload extends BasePayload {
  op: "glitch";
  rgbShift: number;
  scanlineIntensity: number;
  blockDisplace: number;
  seed: number;
}

export type ImageWorkerPayload =
  | ResizePayload
  | CropPayload
  | EncodePayload
  | PalettePayload
  | DuotonePayload
  | GrainPayload
  | FramePayload
  | LongShadowPayload
  | HalftonePayload
  | GlitchPayload;

export interface ImageOpResult {
  blob: Blob;
  width: number;
  height: number;
}

export interface PaletteColor {
  hex: string;
  rgb: [number, number, number];
  hsl: [number, number, number];
  population: number;
}

export interface PaletteResult {
  colors: PaletteColor[];
}
