import type { ComponentType } from "react";
import { IconBase, type IconProps } from "./IconBase";
import { Grid3x3Icon, CATEGORY_ICONS } from "./categoryIcons";
import type { ToolDefinition } from "../../types/tool";

// ---------- Image ----------

function ResizeIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M8 3H3v5M16 21h5v-5M3 16v5h5M21 8V3h-5" />
    </IconBase>
  );
}

function CropIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M6 2v14a2 2 0 002 2h14" />
      <path d="M18 22V8a2 2 0 00-2-2H2" />
    </IconBase>
  );
}

function CompressIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 9h5V4M20 9h-5V4M4 15h5v5M20 15h-5v5" />
    </IconBase>
  );
}

function ConvertIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M17 2l4 4-4 4" />
      <path d="M3 11V9a4 4 0 014-4h14" />
      <path d="M7 22l-4-4 4-4" />
      <path d="M21 13v2a4 4 0 01-4 4H3" />
    </IconBase>
  );
}

function PaletteIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 3a9 9 0 100 18c1.4 0 2-.9 2-1.9s-.5-1.4-.5-2.3.9-1.6 2-1.6h2a4 4 0 004-4c0-4.5-4.5-8.2-9.5-8.2z" />
      <circle cx="7.5" cy="10.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="10.5" cy="7.3" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="14.8" cy="7.6" r="1.1" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

function InfoIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8h.01M12 11.5v5" />
    </IconBase>
  );
}

function VennIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="9" cy="12" r="6" />
      <circle cx="15" cy="12" r="6" />
    </IconBase>
  );
}

// ---------- Video ----------

function ScissorsIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="6" cy="6" r="2.2" />
      <circle cx="6" cy="18" r="2.2" />
      <path d="M20 4L7.5 16.5M8 8L20 20M9 12h3" />
    </IconBase>
  );
}

function ExtractFrameIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="3" y="4" width="12" height="9" rx="1.5" />
      <rect x="9" y="11" width="12" height="9" rx="1.5" />
      <path d="M9 11l3-3" />
    </IconBase>
  );
}

function SafeZoneIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <rect x="7" y="7" width="10" height="10" rx="1" strokeDasharray="2.2 2.2" />
    </IconBase>
  );
}

function CutDetectionIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 12h4l2-6 4 12 2-6h4" />
      <path d="M12 3v3M12 18v3" strokeDasharray="1.6 1.6" />
    </IconBase>
  );
}

function ShotAnalyzerIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M3 7l2-4h14l2 4" />
      <rect x="3" y="7" width="18" height="14" rx="2" />
      <path d="M8 21v-6M12 21v-9M16 21v-4" />
    </IconBase>
  );
}

// ---------- Design ----------

function GradientIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <path d="M3 21L21 3" />
    </IconBase>
  );
}

function DuotoneIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="9" cy="12" r="7" />
      <circle cx="15" cy="12" r="7" fill="currentColor" fillOpacity="0.22" stroke="none" />
    </IconBase>
  );
}

function GrainIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <circle cx="7.5" cy="8" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="13" cy="6.5" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="17" cy="9.5" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="8.5" cy="13" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="15" cy="14" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="7" cy="17.5" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="12" cy="18.5" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="17.5" cy="17" r="0.9" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

function BorderFrameIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="2" strokeDasharray="2.6 2.6" />
      <rect x="8" y="8" width="8" height="8" rx="1" />
    </IconBase>
  );
}

function LongShadowIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 11L11 4h8v8l-7 7H4v-8z" fill="currentColor" fillOpacity="0.18" stroke="none" />
      <rect x="4" y="4" width="7" height="7" rx="1" />
    </IconBase>
  );
}

function HalftoneIcon(props: IconProps) {
  return (
    <IconBase {...props} fill="currentColor" stroke="none">
      <circle cx="6" cy="6" r="2.1" />
      <circle cx="12.2" cy="6" r="1.5" />
      <circle cx="18" cy="6" r="0.9" />
      <circle cx="6" cy="12.2" r="1.5" />
      <circle cx="12.2" cy="12.2" r="1.1" />
      <circle cx="18" cy="12.2" r="0.7" />
      <circle cx="6" cy="18" r="0.9" />
      <circle cx="12.2" cy="18" r="0.7" />
      <circle cx="18" cy="18" r="0.5" />
    </IconBase>
  );
}

function GlitchIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="3" y="5" width="12" height="4" />
      <rect x="7" y="10" width="12" height="4" />
      <rect x="3" y="15" width="12" height="4" />
    </IconBase>
  );
}

function PerspectiveGridIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 3L3 21M12 3l9 18M3 21h18" />
      <path d="M7.5 12h9" />
    </IconBase>
  );
}

function LayoutGridIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M9 9v12" />
    </IconBase>
  );
}

function TypeScaleIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M3.5 19L7 8l3.5 11M4.3 15h5.4" />
      <path d="M13.5 19v-6.5l1.7-3.5 1.7 3.5V19M13.9 16.2h2.6" />
    </IconBase>
  );
}

// ---------- Social ----------

function AspectRatioIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M14 4h6v6M10 20H4v-6" />
    </IconBase>
  );
}

function StackedCardsIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="3" y="7" width="12" height="14" rx="2" />
      <rect x="9" y="3" width="12" height="14" rx="2" />
    </IconBase>
  );
}

function PlayFrameIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <path d="M10 8l6 4-6 4z" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

// ---------- Creative QA ----------

function ClipboardCheckIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4h6v2H9z" fill="currentColor" stroke="none" />
      <path d="M9 13l2 2 4-4" />
    </IconBase>
  );
}

function CompareSplitIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M12 4v16" />
      <path d="M7 10l-2 2 2 2M17 10l2 2-2 2" />
    </IconBase>
  );
}

// ---------- Assets ----------

function TagIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M3 12l8-8h8v8l-8 8-8-8z" />
      <circle cx="9" cy="9" r="1.2" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

function RulerIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="3" y="8" width="18" height="8" rx="1.5" />
      <path d="M7 8v3M11 8v3M15 8v3M19 8v3" />
    </IconBase>
  );
}

function DuplicateIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="4" y="4" width="12" height="12" rx="2" />
      <rect x="9" y="9" width="12" height="12" rx="2" />
    </IconBase>
  );
}

function VectorNodeIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 20L14 4l6 3-10 13z" />
      <circle cx="14" cy="4" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="4" cy="20" r="1.2" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

// ---------- Brand ----------

function SwatchesIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="3" y="7" width="6" height="14" rx="1.5" />
      <rect x="10.5" y="4" width="6" height="17" rx="1.5" />
      <rect x="18" y="9" width="3" height="12" rx="1.5" />
    </IconBase>
  );
}

function AaIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 19l4-14 4 14M5.2 14h5.6" />
      <path d="M15 19v-7a3 3 0 116 0v7M15 15h6" />
    </IconBase>
  );
}

function BracesIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M8 4c-2 0-3 1-3 3v3c0 1-1 2-2 2 1 0 2 1 2 2v3c0 2 1 3 3 3" />
      <path d="M16 4c2 0 3 1 3 3v3c0 1 1 2 2 2-1 0-2 1-2 2v3c0 2-1 3-3 3" />
    </IconBase>
  );
}

function ShieldStarIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
      <path
        d="M12 8l1.1 2.2 2.4.35-1.75 1.7.4 2.4-2.15-1.15-2.15 1.15.4-2.4-1.75-1.7 2.4-.35z"
        fill="currentColor"
        stroke="none"
      />
    </IconBase>
  );
}

function LogoFrameIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray="2.6 2.6" />
      <circle cx="12" cy="12" r="4" />
    </IconBase>
  );
}

// ---------- Production ----------

function LayersIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="3" y="3" width="14" height="14" rx="2" />
      <rect x="7" y="7" width="14" height="14" rx="2" />
    </IconBase>
  );
}

function VideoStackIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="3" y="3" width="13" height="13" rx="2" />
      <path d="M7.5 6.5l3.5 2.5-3.5 2.5z" fill="currentColor" stroke="none" />
      <rect x="8" y="8" width="13" height="13" rx="2" />
    </IconBase>
  );
}

function SequenceIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="2" y="8" width="6" height="8" rx="1" />
      <rect x="9" y="8" width="6" height="8" rx="1" />
      <rect x="16" y="8" width="6" height="8" rx="1" />
      <path d="M8 12h1M15 12h1" />
    </IconBase>
  );
}

function FileSizeIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M6 2h9l5 5v15H6V2z" />
      <path d="M15 2v5h5" />
      <path d="M9 14h6M9 17h4" />
    </IconBase>
  );
}

function SlidersIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 6h10M18 6h2M4 12h4M10 12h10M4 18h9M17 18h3" />
      <circle cx="16" cy="6" r="2" fill="currentColor" stroke="none" />
      <circle cx="8" cy="12" r="2" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="18" r="2" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

function ArchiveIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M12 4v3M12 9v2M12 13v2M12 17v3" strokeDasharray="1.8 1.8" />
    </IconBase>
  );
}

// ---------- Review ----------

function BeforeAfterIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3a9 9 0 010 18z" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

function StarShapeIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 3l2.6 5.6 6.1.6-4.6 4.1 1.3 6-5.4-3.2-5.4 3.2 1.3-6-4.6-4.1 6.1-.6z" />
    </IconBase>
  );
}

function MarkupPenIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 20l1-4 9-9 3 3-9 9-4 1z" />
      <path d="M14 7l3-3 3 3-3 3" />
    </IconBase>
  );
}

function PresentationIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
      <path d="M8 11l2.5-2.5L13 11l3-3" />
    </IconBase>
  );
}

function ApprovalIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12l3 3 5-6" />
    </IconBase>
  );
}

const TOOL_ICONS: Record<string, ComponentType<IconProps>> = {
  "image-resize": ResizeIcon,
  "image-crop": CropIcon,
  "image-compress": CompressIcon,
  "image-convert": ConvertIcon,
  "image-palette": PaletteIcon,
  "image-metadata": InfoIcon,
  "image-difference": VennIcon,

  "video-trim": ScissorsIcon,
  "video-frames": ExtractFrameIcon,
  "video-contact-sheet": Grid3x3Icon,
  "video-safe-zone": SafeZoneIcon,
  "video-cut-detection": CutDetectionIcon,
  "video-shot-analyzer": ShotAnalyzerIcon,

  "design-gradient": GradientIcon,
  "design-duotone": DuotoneIcon,
  "design-grain": GrainIcon,
  "design-border-frame": BorderFrameIcon,
  "design-long-shadow": LongShadowIcon,
  "design-halftone": HalftoneIcon,
  "design-glitch": GlitchIcon,
  "design-perspective-grid": PerspectiveGridIcon,
  "design-layout-grid": LayoutGridIcon,
  "design-type-scale": TypeScaleIcon,

  "social-resize": AspectRatioIcon,
  "social-carousel": StackedCardsIcon,
  "social-thumbnail-preview": PlayFrameIcon,
  "social-profile-grid": Grid3x3Icon,

  "qa-export-preflight": ClipboardCheckIcon,
  "qa-version-comparator": CompareSplitIcon,

  "assets-batch-renamer": TagIcon,
  "assets-dimension-scanner": RulerIcon,
  "assets-contact-sheet": Grid3x3Icon,
  "assets-duplicate-finder": DuplicateIcon,
  "assets-svg-optimizer": VectorNodeIcon,

  "brand-color-manager": SwatchesIcon,
  "brand-typography-board": AaIcon,
  "brand-token-generator": BracesIcon,
  "brand-validator": ShieldStarIcon,
  "brand-logo-safe-area": LogoFrameIcon,

  "production-batch-image": LayersIcon,
  "production-batch-video": VideoStackIcon,
  "production-image-sequence": SequenceIcon,
  "production-file-size-calculator": FileSizeIcon,
  "production-export-presets": SlidersIcon,
  "production-zip-builder": ArchiveIcon,

  "review-before-after": BeforeAfterIcon,
  "review-rating-board": StarShapeIcon,
  "review-annotation-board": MarkupPenIcon,
  "review-presentation-builder": PresentationIcon,
  "review-approval-tracker": ApprovalIcon,
};

export function getToolIcon(tool: ToolDefinition): ComponentType<IconProps> {
  return TOOL_ICONS[tool.id] ?? CATEGORY_ICONS[tool.category];
}
