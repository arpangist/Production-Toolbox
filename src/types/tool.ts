import type { ComponentType } from "react";

export type ToolCategory =
  | "image"
  | "video"
  | "design"
  | "social"
  | "brand"
  | "qa"
  | "assets"
  | "production"
  | "review";

export const CATEGORY_LABELS: Record<ToolCategory, string> = {
  image: "Image",
  video: "Video",
  design: "Design",
  social: "Social",
  brand: "Brand",
  qa: "Creative QA",
  assets: "Asset Management",
  production: "Production",
  review: "Review",
};

// Heavier categories get their processing code split into a separate
// lazy-loaded chunk so opening a light tool never downloads it.
export const CATEGORY_WEIGHT: Record<ToolCategory, "light" | "heavy"> = {
  image: "light",
  video: "heavy",
  design: "light",
  social: "light",
  brand: "light",
  qa: "light",
  assets: "light",
  production: "heavy",
  review: "light",
};

export interface ToolCapabilityRequirements {
  webWorker?: boolean;
  offscreenCanvas?: boolean;
  webCodecs?: boolean;
  mediaRecorder?: boolean;
}

export interface ToolDefinition {
  id: string;
  name: string;
  category: ToolCategory;
  description: string;
  keywords: string[];
  acceptedFileTypes: string[];
  outputTypes: string[];
  capabilityRequirements?: ToolCapabilityRequirements;
  /** Lazy import of the tool's workspace component. Not loaded until opened. */
  load: () => Promise<{ default: ComponentType<{ tool: ToolDefinition }> }>;
  status: "available" | "coming-soon";
}
