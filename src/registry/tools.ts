import type { ToolDefinition } from "../types/tool";

const loadResize = () => import("../components/tools/image/ResizeWorkspace");
const loadEncode = () => import("../components/tools/image/EncodeWorkspace");
const loadPalette = () => import("../components/tools/image/PaletteWorkspace");
const loadCrop = () => import("../components/tools/image/CropWorkspace");
const loadGradient = () => import("../components/tools/design/GradientWorkspace");
const loadDuotone = () => import("../components/tools/design/DuotoneWorkspace");
const loadGrain = () => import("../components/tools/design/GrainWorkspace");
const loadSocialResize = () => import("../components/tools/social/SocialResizeWorkspace");
const loadCarousel = () => import("../components/tools/social/CarouselWorkspace");
const loadPreflight = () => import("../components/tools/qa/PreflightWorkspace");
const loadTrim = () => import("../components/tools/video/TrimWorkspace");
const loadFrameExtractor = () => import("../components/tools/video/FrameExtractorWorkspace");
const loadContactSheet = () => import("../components/tools/video/ContactSheetWorkspace");
const loadSafeZone = () => import("../components/tools/video/SafeZoneWorkspace");
const loadMetadata = () => import("../components/tools/image/MetadataWorkspace");
const loadDifference = () => import("../components/tools/image/DifferenceWorkspace");
const loadThumbnailPreview = () => import("../components/tools/social/ThumbnailPreviewWorkspace");
const loadProfileGrid = () => import("../components/tools/social/ProfileGridWorkspace");
const loadCutDetection = () => import("../components/tools/video/CutDetectionWorkspace");
const loadShotAnalyzer = () => import("../components/tools/video/ShotAnalyzerWorkspace");
const loadBatchRenamer = () => import("../components/tools/assets/BatchRenamerWorkspace");
const loadDimensionScanner = () => import("../components/tools/assets/DimensionScannerWorkspace");
const loadAssetContactSheet = () => import("../components/tools/assets/AssetContactSheetWorkspace");
const loadDuplicateFinder = () => import("../components/tools/assets/DuplicateFinderWorkspace");
const loadSvgOptimizer = () => import("../components/tools/assets/SvgOptimizerWorkspace");
const loadBorderFrame = () => import("../components/tools/design/BorderFrameWorkspace");
const loadLongShadow = () => import("../components/tools/design/LongShadowWorkspace");
const loadPerspectiveGrid = () => import("../components/tools/design/PerspectiveGridWorkspace");
const loadLayoutGrid = () => import("../components/tools/design/LayoutGridWorkspace");
const loadTypeScale = () => import("../components/tools/design/TypeScaleWorkspace");
const loadHalftone = () => import("../components/tools/design/HalftoneWorkspace");
const loadGlitch = () => import("../components/tools/design/GlitchWorkspace");
const loadBrandColorManager = () => import("../components/tools/brand/BrandColorManagerWorkspace");
const loadTypographyBoard = () => import("../components/tools/brand/TypographyBoardWorkspace");
const loadTokenGenerator = () => import("../components/tools/brand/TokenGeneratorWorkspace");
const loadBrandValidator = () => import("../components/tools/brand/BrandValidatorWorkspace");
const loadLogoSafeArea = () => import("../components/tools/brand/LogoSafeAreaWorkspace");
const loadVersionComparator = () => import("../components/tools/qa/VersionComparatorWorkspace");
const loadBatchImageProcessor = () => import("../components/tools/production/BatchImageProcessorWorkspace");
const loadBatchVideoProcessor = () => import("../components/tools/production/BatchVideoProcessorWorkspace");
const loadImageSequenceBuilder = () => import("../components/tools/production/ImageSequenceBuilderWorkspace");
const loadFileSizeCalculator = () => import("../components/tools/production/FileSizeCalculatorWorkspace");
const loadExportPresets = () => import("../components/tools/production/ExportPresetsWorkspace");
const loadZipAssetBuilder = () => import("../components/tools/production/ZipAssetBuilderWorkspace");
const loadBeforeAfter = () => import("../components/tools/review/BeforeAfterWorkspace");
const loadRatingBoard = () => import("../components/tools/review/RatingBoardWorkspace");
const loadAnnotationBoard = () => import("../components/tools/review/AnnotationBoardWorkspace");
const loadPresentationBuilder = () => import("../components/tools/review/PresentationBuilderWorkspace");
const loadApprovalTracker = () => import("../components/tools/review/ApprovalTrackerWorkspace");

const IMAGE_ACCEPT = ["image/*"];
const VIDEO_ACCEPT = ["video/*"];

export const tools: ToolDefinition[] = [
  // IMAGE
  {
    id: "image-resize",
    name: "Resize",
    category: "image",
    description: "Resize images with a locked aspect ratio, percentage scaling, or platform presets.",
    keywords: ["resize", "scale", "dimensions", "width", "height"],
    acceptedFileTypes: IMAGE_ACCEPT,
    outputTypes: IMAGE_ACCEPT,
    capabilityRequirements: { webWorker: true, offscreenCanvas: true },
    load: loadResize,
    status: "available",
  },
  {
    id: "image-crop",
    name: "Crop",
    category: "image",
    description: "Crop to free-form or fixed ratios such as 1:1, 4:5, 9:16, and 16:9.",
    keywords: ["crop", "ratio", "1:1", "16:9", "9:16", "4:5"],
    acceptedFileTypes: IMAGE_ACCEPT,
    outputTypes: IMAGE_ACCEPT,
    capabilityRequirements: { webWorker: true, offscreenCanvas: true },
    load: loadCrop,
    status: "available",
  },
  {
    id: "image-compress",
    name: "Compress",
    category: "image",
    description: "Compress JPEG, PNG, WebP, and AVIF locally with a live before/after preview.",
    keywords: ["compress", "optimize", "quality", "jpeg", "png", "webp", "avif"],
    acceptedFileTypes: IMAGE_ACCEPT,
    outputTypes: IMAGE_ACCEPT,
    capabilityRequirements: { webWorker: true, offscreenCanvas: true },
    load: loadEncode,
    status: "available",
  },
  {
    id: "image-convert",
    name: "Format Converter",
    category: "image",
    description: "Convert between supported image formats entirely in the browser.",
    keywords: ["convert", "format", "jpg", "png", "webp", "avif"],
    acceptedFileTypes: IMAGE_ACCEPT,
    outputTypes: IMAGE_ACCEPT,
    capabilityRequirements: { webWorker: true, offscreenCanvas: true },
    load: loadEncode,
    status: "available",
  },
  {
    id: "image-palette",
    name: "Palette Extractor",
    category: "image",
    description: "Extract dominant colors as HEX, RGB, HSL, or CSS variables.",
    keywords: ["palette", "color", "hex", "rgb", "hsl", "swatch"],
    acceptedFileTypes: IMAGE_ACCEPT,
    outputTypes: ["text/css", "application/json"],
    capabilityRequirements: { webWorker: true },
    load: loadPalette,
    status: "available",
  },

  // VIDEO
  {
    id: "video-trim",
    name: "Trim",
    category: "video",
    description: "Set in/out points on a timeline and export a trimmed clip locally.",
    keywords: ["trim", "cut", "timeline", "in point", "out point"],
    acceptedFileTypes: VIDEO_ACCEPT,
    outputTypes: VIDEO_ACCEPT,
    capabilityRequirements: { webWorker: true, webCodecs: true, mediaRecorder: true },
    load: loadTrim,
    status: "available",
  },
  {
    id: "video-frames",
    name: "Frame Extractor",
    category: "video",
    description: "Scrub or step through a video and export individual frames as JPG or PNG.",
    keywords: ["frame", "extract", "screenshot", "still", "scrubber"],
    acceptedFileTypes: VIDEO_ACCEPT,
    outputTypes: IMAGE_ACCEPT,
    capabilityRequirements: { webWorker: true, webCodecs: true },
    load: loadFrameExtractor,
    status: "available",
  },
  {
    id: "video-contact-sheet",
    name: "Contact Sheet",
    category: "video",
    description: "Generate a grid of video frames with configurable interval and timestamp labels.",
    keywords: ["contact sheet", "grid", "thumbnails", "storyboard"],
    acceptedFileTypes: VIDEO_ACCEPT,
    outputTypes: IMAGE_ACCEPT,
    capabilityRequirements: { webWorker: true, webCodecs: true },
    load: loadContactSheet,
    status: "available",
  },
  {
    id: "video-safe-zone",
    name: "Safe Zone",
    category: "video",
    description: "Overlay configurable social-video safe areas for title and action.",
    keywords: ["safe zone", "overlay", "guides", "title safe", "action safe"],
    acceptedFileTypes: VIDEO_ACCEPT,
    outputTypes: IMAGE_ACCEPT,
    capabilityRequirements: { webWorker: true },
    load: loadSafeZone,
    status: "available",
  },

  // DESIGN
  {
    id: "design-gradient",
    name: "Gradient Generator",
    category: "design",
    description: "Build linear, radial, and conic gradients with multiple stops.",
    keywords: ["gradient", "css", "linear", "radial", "conic"],
    acceptedFileTypes: [],
    outputTypes: ["text/css", "image/svg+xml", "image/png"],
    capabilityRequirements: {},
    load: loadGradient,
    status: "available",
  },
  {
    id: "design-duotone",
    name: "Duotone",
    category: "design",
    description: "Convert an image into a two-color duotone treatment.",
    keywords: ["duotone", "two-tone", "color", "effect"],
    acceptedFileTypes: IMAGE_ACCEPT,
    outputTypes: IMAGE_ACCEPT,
    capabilityRequirements: { webWorker: true, offscreenCanvas: true },
    load: loadDuotone,
    status: "available",
  },
  {
    id: "design-grain",
    name: "Grain / Noise",
    category: "design",
    description: "Add film grain, digital noise, dust, and scratches to an image.",
    keywords: ["grain", "noise", "texture", "dust", "scratches"],
    acceptedFileTypes: IMAGE_ACCEPT,
    outputTypes: IMAGE_ACCEPT,
    capabilityRequirements: { webWorker: true, offscreenCanvas: true },
    load: loadGrain,
    status: "available",
  },

  // SOCIAL
  {
    id: "social-resize",
    name: "Format Resize",
    category: "social",
    description: "Resize for Instagram, TikTok, YouTube, Facebook, LinkedIn, and Pinterest presets.",
    keywords: ["social", "instagram", "tiktok", "youtube", "facebook", "linkedin", "pinterest"],
    acceptedFileTypes: IMAGE_ACCEPT,
    outputTypes: IMAGE_ACCEPT,
    capabilityRequirements: { webWorker: true },
    load: loadSocialResize,
    status: "available",
  },
  {
    id: "social-carousel",
    name: "Carousel Splitter",
    category: "social",
    description: "Split one large image into evenly divided carousel slides.",
    keywords: ["carousel", "slides", "split", "instagram"],
    acceptedFileTypes: IMAGE_ACCEPT,
    outputTypes: IMAGE_ACCEPT,
    capabilityRequirements: { webWorker: true, offscreenCanvas: true },
    load: loadCarousel,
    status: "available",
  },

  // CREATIVE QA
  {
    id: "qa-export-preflight",
    name: "Export Preflight",
    category: "qa",
    description: "Run a deterministic production checklist before an asset ships: dimensions, ratio, resolution, file size, safe area, and transparency.",
    keywords: ["preflight", "checklist", "qa", "export", "validation"],
    acceptedFileTypes: IMAGE_ACCEPT,
    outputTypes: ["application/json"],
    capabilityRequirements: { webWorker: true },
    load: loadPreflight,
    status: "available",
  },

  // IMAGE — extension
  {
    id: "image-metadata",
    name: "Metadata Viewer",
    category: "image",
    description: "Display filename, dimensions, and EXIF data actually present in the file — nothing is inferred.",
    keywords: ["metadata", "exif", "camera", "info", "details"],
    acceptedFileTypes: IMAGE_ACCEPT,
    outputTypes: [],
    capabilityRequirements: {},
    load: loadMetadata,
    status: "available",
  },
  {
    id: "image-difference",
    name: "Difference Viewer",
    category: "image",
    description: "Compare two images side-by-side, overlaid, sliding, blinking, or as a pixel difference map.",
    keywords: ["difference", "compare", "diff", "before after", "revision"],
    acceptedFileTypes: IMAGE_ACCEPT,
    outputTypes: IMAGE_ACCEPT,
    capabilityRequirements: {},
    load: loadDifference,
    status: "available",
  },

  // SOCIAL — extension
  {
    id: "social-thumbnail-preview",
    name: "Thumbnail Preview",
    category: "social",
    description: "Preview one image at multiple real display sizes to check it still reads once it shrinks.",
    keywords: ["thumbnail", "preview", "small", "legibility"],
    acceptedFileTypes: IMAGE_ACCEPT,
    outputTypes: [],
    capabilityRequirements: {},
    load: loadThumbnailPreview,
    status: "available",
  },
  {
    id: "social-profile-grid",
    name: "Profile Grid Preview",
    category: "social",
    description: "Arrange and reorder posts to simulate how they'll look together in a profile grid.",
    keywords: ["profile", "grid", "instagram", "feed", "layout"],
    acceptedFileTypes: IMAGE_ACCEPT,
    outputTypes: [],
    capabilityRequirements: {},
    load: loadProfileGrid,
    status: "available",
  },

  // VIDEO — extension
  {
    id: "video-cut-detection",
    name: "Cut Detection",
    category: "video",
    description: "Detect shot boundaries from frame-to-frame differences and list every cut's timestamp.",
    keywords: ["cut", "detection", "shots", "edit", "scene"],
    acceptedFileTypes: VIDEO_ACCEPT,
    outputTypes: [],
    capabilityRequirements: {},
    load: loadCutDetection,
    status: "available",
  },
  {
    id: "video-shot-analyzer",
    name: "Shot Analyzer",
    category: "video",
    description: "Analyze cut-detected shot structure: total shots, average/shortest/longest duration, and a duration histogram.",
    keywords: ["shot", "analyzer", "pacing", "rhythm", "stats"],
    acceptedFileTypes: VIDEO_ACCEPT,
    outputTypes: [],
    capabilityRequirements: {},
    load: loadShotAnalyzer,
    status: "available",
  },

  // ASSET MANAGEMENT
  {
    id: "assets-batch-renamer",
    name: "Batch Renamer",
    category: "assets",
    description: "Rename many files at once using a token pattern, then download the renamed copies as a ZIP.",
    keywords: ["rename", "batch", "pattern", "files"],
    acceptedFileTypes: [],
    outputTypes: ["application/zip"],
    capabilityRequirements: {},
    load: loadBatchRenamer,
    status: "available",
  },
  {
    id: "assets-dimension-scanner",
    name: "Asset Dimension Scanner",
    category: "assets",
    description: "Scan many images at once into a sortable table of dimensions, ratio, size, and format.",
    keywords: ["dimensions", "scanner", "batch", "table"],
    acceptedFileTypes: IMAGE_ACCEPT,
    outputTypes: [],
    capabilityRequirements: {},
    load: loadDimensionScanner,
    status: "available",
  },
  {
    id: "assets-contact-sheet",
    name: "Asset Contact Sheet",
    category: "assets",
    description: "Create a visual index sheet from multiple images with configurable columns and labels.",
    keywords: ["contact sheet", "index", "grid", "batch"],
    acceptedFileTypes: IMAGE_ACCEPT,
    outputTypes: IMAGE_ACCEPT,
    capabilityRequirements: {},
    load: loadAssetContactSheet,
    status: "available",
  },
  {
    id: "assets-duplicate-finder",
    name: "Duplicate Finder",
    category: "assets",
    description: "Find exact duplicates by file hash and visually similar images by perceptual hash — nothing is deleted automatically.",
    keywords: ["duplicate", "finder", "hash", "similar", "cleanup"],
    acceptedFileTypes: [],
    outputTypes: ["application/zip"],
    capabilityRequirements: { webWorker: true },
    load: loadDuplicateFinder,
    status: "available",
  },
  {
    id: "assets-svg-optimizer",
    name: "SVG Optimizer",
    category: "assets",
    description: "Strip comments, metadata, and excess precision from SVG files with a visual before/after comparison.",
    keywords: ["svg", "optimize", "minify", "vector"],
    acceptedFileTypes: [".svg", "image/svg+xml"],
    outputTypes: ["image/svg+xml"],
    capabilityRequirements: {},
    load: loadSvgOptimizer,
    status: "available",
  },

  // DESIGN — extension
  {
    id: "design-border-frame",
    name: "Border & Frame",
    category: "design",
    description: "Add professional borders and presentation frames with padding, shadow, and corner radius presets.",
    keywords: ["border", "frame", "polaroid", "padding", "presentation"],
    acceptedFileTypes: IMAGE_ACCEPT,
    outputTypes: IMAGE_ACCEPT,
    capabilityRequirements: { webWorker: true, offscreenCanvas: true },
    load: loadBorderFrame,
    status: "available",
  },
  {
    id: "design-long-shadow",
    name: "Long Shadow",
    category: "design",
    description: "Generate a deterministic long shadow behind an image's silhouette with configurable angle and fade.",
    keywords: ["long shadow", "flat design", "shadow"],
    acceptedFileTypes: IMAGE_ACCEPT,
    outputTypes: IMAGE_ACCEPT,
    capabilityRequirements: { webWorker: true, offscreenCanvas: true },
    load: loadLongShadow,
    status: "available",
  },
  {
    id: "design-halftone",
    name: "Halftone",
    category: "design",
    description: "Convert an image into a halftone dot, square, or line pattern with configurable angle and cell size.",
    keywords: ["halftone", "dots", "print", "newsprint"],
    acceptedFileTypes: IMAGE_ACCEPT,
    outputTypes: IMAGE_ACCEPT,
    capabilityRequirements: { webWorker: true, offscreenCanvas: true },
    load: loadHalftone,
    status: "available",
  },
  {
    id: "design-glitch",
    name: "Glitch Effects",
    category: "design",
    description: "Apply deterministic RGB split, scanline, and block-displacement glitch effects to an image.",
    keywords: ["glitch", "distortion", "rgb split", "scanlines", "vhs"],
    acceptedFileTypes: IMAGE_ACCEPT,
    outputTypes: IMAGE_ACCEPT,
    capabilityRequirements: { webWorker: true, offscreenCanvas: true },
    load: loadGlitch,
    status: "available",
  },
  {
    id: "design-perspective-grid",
    name: "Perspective Grid",
    category: "design",
    description: "Generate 1, 2, or 3-point perspective drawing grids with adjustable vanishing points.",
    keywords: ["perspective", "grid", "vanishing point", "drawing"],
    acceptedFileTypes: [],
    outputTypes: ["image/svg+xml", "image/png"],
    capabilityRequirements: {},
    load: loadPerspectiveGrid,
    status: "available",
  },
  {
    id: "design-layout-grid",
    name: "Layout Grid",
    category: "design",
    description: "Build column, gutter, margin, and baseline layout grids with editorial and web presets.",
    keywords: ["layout", "grid", "columns", "gutter", "baseline"],
    acceptedFileTypes: [],
    outputTypes: ["image/png"],
    capabilityRequirements: {},
    load: loadLayoutGrid,
    status: "available",
  },
  {
    id: "design-type-scale",
    name: "Typography Scale",
    category: "design",
    description: "Generate a mathematically consistent type scale from a base size and ratio, exportable as CSS, JSON, or text.",
    keywords: ["typography", "type scale", "ratio", "font size"],
    acceptedFileTypes: [],
    outputTypes: ["text/css", "application/json", "image/png"],
    capabilityRequirements: {},
    load: loadTypeScale,
    status: "available",
  },

  // BRAND
  {
    id: "brand-color-manager",
    name: "Brand Color Manager",
    category: "brand",
    description: "Create and store a local brand color palette with named swatches — no account required.",
    keywords: ["brand", "colors", "palette", "swatches"],
    acceptedFileTypes: [],
    outputTypes: [],
    capabilityRequirements: {},
    load: loadBrandColorManager,
    status: "available",
  },
  {
    id: "brand-typography-board",
    name: "Typography Board",
    category: "brand",
    description: "Compare headline, body, and caption font combinations side by side with your own preview text.",
    keywords: ["typography", "board", "fonts", "compare"],
    acceptedFileTypes: [],
    outputTypes: [],
    capabilityRequirements: {},
    load: loadTypographyBoard,
    status: "available",
  },
  {
    id: "brand-token-generator",
    name: "Token Generator",
    category: "brand",
    description: "Build a set of color, spacing, radius, and shadow design tokens and export them as CSS, SCSS, or JSON.",
    keywords: ["design tokens", "css variables", "scss", "json"],
    acceptedFileTypes: [],
    outputTypes: ["text/css", "text/scss", "application/json"],
    capabilityRequirements: {},
    load: loadTokenGenerator,
    status: "available",
  },
  {
    id: "brand-validator",
    name: "Brand Validator",
    category: "brand",
    description: "Check an asset's dominant colors and dimensions against manually defined brand rules — deterministic, not AI.",
    keywords: ["brand", "validator", "rules", "compliance"],
    acceptedFileTypes: IMAGE_ACCEPT,
    outputTypes: [],
    capabilityRequirements: { webWorker: true },
    load: loadBrandValidator,
    status: "available",
  },
  {
    id: "brand-logo-safe-area",
    name: "Logo Safe Area",
    category: "brand",
    description: "Define clear space and minimum size around a logo and export a visual safe-area diagram.",
    keywords: ["logo", "safe area", "clear space", "minimum size"],
    acceptedFileTypes: IMAGE_ACCEPT,
    outputTypes: ["image/png"],
    capabilityRequirements: {},
    load: loadLogoSafeArea,
    status: "available",
  },

  // CREATIVE QA — extension
  {
    id: "qa-version-comparator",
    name: "Creative Version Comparator",
    category: "qa",
    description: "Compare multiple versions of an asset side-by-side or with a slider, with dimensions and file size for each.",
    keywords: ["version", "compare", "revision", "before after"],
    acceptedFileTypes: IMAGE_ACCEPT,
    outputTypes: [],
    capabilityRequirements: {},
    load: loadVersionComparator,
    status: "available",
  },

  // PRODUCTION
  {
    id: "production-batch-image",
    name: "Batch Image Processor",
    category: "production",
    description: "Chain resize, compress/convert, and rename into one reorderable pipeline and run it across many images at once.",
    keywords: ["batch", "pipeline", "resize", "compress", "rename"],
    acceptedFileTypes: IMAGE_ACCEPT,
    outputTypes: IMAGE_ACCEPT,
    capabilityRequirements: { webWorker: true, offscreenCanvas: true },
    load: loadBatchImageProcessor,
    status: "available",
  },
  {
    id: "production-batch-video",
    name: "Batch Video Processor",
    category: "production",
    description: "Crop and resize many videos to the same target size in a queue, with per-file progress.",
    keywords: ["batch", "video", "crop", "resize", "queue"],
    acceptedFileTypes: VIDEO_ACCEPT,
    outputTypes: VIDEO_ACCEPT,
    capabilityRequirements: { mediaRecorder: true },
    load: loadBatchVideoProcessor,
    status: "available",
  },
  {
    id: "production-image-sequence",
    name: "Image Sequence Builder",
    category: "production",
    description: "Reorder a set of frames, preview them at a chosen FPS, and export as a renamed ZIP or a WebM video.",
    keywords: ["sequence", "frames", "fps", "stop motion", "timelapse"],
    acceptedFileTypes: IMAGE_ACCEPT,
    outputTypes: ["application/zip", "video/webm"],
    capabilityRequirements: { mediaRecorder: true },
    load: loadImageSequenceBuilder,
    status: "available",
  },
  {
    id: "production-file-size-calculator",
    name: "File Size Calculator",
    category: "production",
    description: "Estimate output file size for images (dimensions, format, quality) and video (duration, bitrate).",
    keywords: ["file size", "calculator", "estimate", "bitrate"],
    acceptedFileTypes: [],
    outputTypes: [],
    capabilityRequirements: {},
    load: loadFileSizeCalculator,
    status: "available",
  },
  {
    id: "production-export-presets",
    name: "Export Presets",
    category: "production",
    description: "Save reusable local export presets — dimensions, FPS, and format — for recurring deliverables.",
    keywords: ["export", "presets", "reusable", "deliverable"],
    acceptedFileTypes: [],
    outputTypes: [],
    capabilityRequirements: {},
    load: loadExportPresets,
    status: "available",
  },
  {
    id: "production-zip-builder",
    name: "ZIP Asset Builder",
    category: "production",
    description: "Package multiple processed files into one organized ZIP with custom paths and an optional README.",
    keywords: ["zip", "package", "bundle", "export"],
    acceptedFileTypes: [],
    outputTypes: ["application/zip"],
    capabilityRequirements: {},
    load: loadZipAssetBuilder,
    status: "available",
  },

  // REVIEW
  {
    id: "review-before-after",
    name: "Before / After",
    category: "review",
    description: "Compose a polished before/after presentation graphic — split reveal or side-by-side — as one exportable PNG.",
    keywords: ["before after", "presentation", "retouching", "restoration"],
    acceptedFileTypes: IMAGE_ACCEPT,
    outputTypes: IMAGE_ACCEPT,
    capabilityRequirements: {},
    load: loadBeforeAfter,
    status: "available",
  },
  {
    id: "review-rating-board",
    name: "Creative Rating Board",
    category: "review",
    description: "Rate a set of assets with stars, optionally by composition, typography, brand, and color — manual, no AI ranking.",
    keywords: ["rating", "review", "stars", "selects"],
    acceptedFileTypes: IMAGE_ACCEPT,
    outputTypes: [],
    capabilityRequirements: {},
    load: loadRatingBoard,
    status: "available",
  },
  {
    id: "review-annotation-board",
    name: "Annotation Board",
    category: "review",
    description: "Mark up an image with arrows, shapes, freehand drawing, and text notes, then export the flattened result.",
    keywords: ["annotate", "markup", "arrows", "feedback", "notes"],
    acceptedFileTypes: IMAGE_ACCEPT,
    outputTypes: IMAGE_ACCEPT,
    capabilityRequirements: {},
    load: loadAnnotationBoard,
    status: "available",
  },
  {
    id: "review-presentation-builder",
    name: "Presentation Builder",
    category: "review",
    description: "Arrange images with captions into a simple presentation, exported as a standalone HTML slideshow or an image sequence.",
    keywords: ["presentation", "slideshow", "deck", "captions"],
    acceptedFileTypes: IMAGE_ACCEPT,
    outputTypes: ["text/html", "application/zip"],
    capabilityRequirements: {},
    load: loadPresentationBuilder,
    status: "available",
  },
  {
    id: "review-approval-tracker",
    name: "Approval Tracker",
    category: "review",
    description: "Track each asset through Draft, Review, Changes Required, and Approved — a lightweight local review board.",
    keywords: ["approval", "tracker", "workflow", "review status"],
    acceptedFileTypes: IMAGE_ACCEPT,
    outputTypes: [],
    capabilityRequirements: {},
    load: loadApprovalTracker,
    status: "available",
  },
];

export function getToolById(id: string): ToolDefinition | undefined {
  return tools.find((tool) => tool.id === id);
}
