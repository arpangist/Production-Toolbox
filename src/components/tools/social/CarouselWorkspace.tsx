import { useEffect, useMemo, useRef, useState } from "react";
import { useFileImport } from "../../../hooks/useFileImport";
import { useImageDimensions } from "../../../hooks/useImageDimensions";
import { useImageProcessor } from "../../../hooks/useImageProcessor";
import { useDebouncedValue } from "../../../hooks/useDebouncedValue";
import { useObjectUrl } from "../../../hooks/useObjectUrl";
import { computeCoverRect } from "../../../lib/coverCrop";
import { WorkspaceShell } from "../../workspace/WorkspaceShell";
import { ImageToolLayout } from "../image/ImageToolLayout";
import { downloadAsZip } from "../../../lib/zipExport";
import type { ImageOpResult } from "../../../workers/imageProcessing.types";
import type { ToolDefinition } from "../../../types/tool";
import imageStyles from "../image/ImageTool.module.css";
import styles from "./CarouselWorkspace.module.css";

const MAX_PREVIEW_WIDTH = 640;
const MAX_PREVIEW_HEIGHT = 420;

const CAROUSEL_PRESETS = [
  { label: "Square · 1080×1080", width: 1080, height: 1080 },
  { label: "Portrait · 1080×1350", width: 1080, height: 1350 },
];

interface Slide {
  url: string;
  blob: Blob;
}

/** Splits [0, total] into `count` integer boundaries so slice widths never
 * drift from rounding the same fraction repeatedly. */
function sliceBoundaries(total: number, count: number): number[] {
  return Array.from({ length: count + 1 }, (_, i) => Math.round((total * i) / count));
}

export default function CarouselWorkspace({ tool }: { tool: ToolDefinition }) {
  const { files, error, importFiles, reset } = useFileImport({ acceptedTypes: ["image/*"], multiple: false });
  const file = files[0] ?? null;
  const dimensions = useImageDimensions(file);
  const originalUrl = useObjectUrl(file);
  const { run } = useImageProcessor();

  const [sliceCount, setSliceCount] = useState(3);
  const [presetIndex, setPresetIndex] = useState(0);
  const preset = CAROUSEL_PRESETS[presetIndex];

  const [slides, setSlides] = useState<Slide[]>([]);
  const [processing, setProcessing] = useState(false);
  const [processError, setProcessError] = useState<string | null>(null);
  const generationRef = useRef(0);

  // The source image is center-cropped to match one continuous panorama at
  // (preset width × slide count) by (preset height), then that panorama is
  // cut into equal tiles — the same approach Instagram carousel splitters
  // use, so every tile comes out at the exact platform size.
  const coverRect = useMemo(() => {
    if (!dimensions) return null;
    return computeCoverRect(dimensions.width, dimensions.height, preset.width * sliceCount, preset.height);
  }, [dimensions, preset, sliceCount]);

  const preview = useMemo(() => {
    if (!dimensions || !coverRect) return null;
    const scale = Math.min(1, MAX_PREVIEW_WIDTH / dimensions.width, MAX_PREVIEW_HEIGHT / dimensions.height);
    return {
      width: Math.round(dimensions.width * scale),
      height: Math.round(dimensions.height * scale),
      cropX: coverRect.x * scale,
      cropY: coverRect.y * scale,
      cropWidth: coverRect.width * scale,
      cropHeight: coverRect.height * scale,
    };
  }, [dimensions, coverRect]);

  const debouncedSliceCount = useDebouncedValue(sliceCount, 250);
  const debouncedCoverRect = useDebouncedValue(coverRect, 250);

  useEffect(() => {
    if (!file || !debouncedCoverRect) return;

    const generation = ++generationRef.current;
    setProcessing(true);
    setProcessError(null);

    const boundaries = sliceBoundaries(debouncedCoverRect.width, debouncedSliceCount);
    const tasks = Array.from({ length: debouncedSliceCount }, (_, index) => {
      const sliceX = boundaries[index];
      const sliceWidth = boundaries[index + 1] - sliceX;
      return run<ImageOpResult>({
        op: "resize",
        file,
        width: preset.width,
        height: preset.height,
        sourceRect: {
          x: debouncedCoverRect.x + sliceX,
          y: debouncedCoverRect.y,
          width: sliceWidth,
          height: debouncedCoverRect.height,
        },
        format: "image/jpeg",
        quality: 0.92,
      }).promise;
    });

    Promise.all(tasks)
      .then((results) => {
        if (generationRef.current !== generation) return;
        setSlides((prev) => {
          for (const slide of prev) URL.revokeObjectURL(slide.url);
          return results.map((res) => ({ blob: res.blob, url: URL.createObjectURL(res.blob) }));
        });
        setProcessing(false);
      })
      .catch((err: Error) => {
        if (generationRef.current !== generation) return;
        setProcessError(err.message);
        setProcessing(false);
      });
  }, [file, debouncedCoverRect, debouncedSliceCount, preset, run]);

  useEffect(() => {
    return () => {
      setSlides((prev) => {
        for (const slide of prev) URL.revokeObjectURL(slide.url);
        return prev;
      });
    };
  }, []);

  const handleDownloadZip = async () => {
    if (slides.length === 0) return;
    const entries = await Promise.all(
      slides.map(async (slide, index) => ({
        name: `slide-${index + 1}.jpg`,
        data: new Uint8Array(await slide.blob.arrayBuffer()),
      })),
    );
    await downloadAsZip(entries, "carousel-slides.zip");
  };

  const handleChangeFile = () => {
    reset();
    setSlides((prev) => {
      for (const slide of prev) URL.revokeObjectURL(slide.url);
      return [];
    });
  };

  const dividers = preview
    ? Array.from({ length: sliceCount - 1 }, (_, i) => i + 1).map((i) => preview.cropX + (preview.cropWidth / sliceCount) * i)
    : [];

  return (
    <WorkspaceShell title={tool.name}>
      <ImageToolLayout
        file={file}
        error={error}
        onFiles={importFiles}
        onChangeFile={handleChangeFile}
        settings={
          <>
            <div className={imageStyles.field}>
              <span className={imageStyles.fieldLabel}>Slide size</span>
              <div className={imageStyles.chipRow}>
                {CAROUSEL_PRESETS.map((option, index) => (
                  <button
                    key={option.label}
                    className={imageStyles.chip}
                    data-active={presetIndex === index}
                    onClick={() => setPresetIndex(index)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div className={imageStyles.field}>
              <span className={imageStyles.fieldLabel}>Slides — {sliceCount}</span>
              <input
                className={imageStyles.slider}
                type="range"
                min={2}
                max={10}
                value={sliceCount}
                onChange={(e) => setSliceCount(Number(e.target.value))}
                aria-label="Number of slides"
              />
            </div>
          </>
        }
        preview={
          <div className={styles.stageWrap}>
            {preview && originalUrl && (
              <div className={styles.stage} style={{ width: preview.width, height: preview.height }}>
                <img className={styles.image} src={originalUrl} width={preview.width} height={preview.height} alt="Source" />
                <div
                  className={styles.cropMask}
                  style={{ left: preview.cropX, top: preview.cropY, width: preview.cropWidth, height: preview.cropHeight }}
                >
                  {dividers.map((left, i) => (
                    <div key={i} className={styles.divider} style={{ left: left - preview.cropX }} />
                  ))}
                </div>
              </div>
            )}
          </div>
        }
        footer={
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", width: "100%" }}>
            {processing && (
              <span className={imageStyles.statusRow} role="status" aria-live="polite">
                Generating slides…
              </span>
            )}
            {processError && (
              <span className={imageStyles.errorText} role="alert">
                Couldn't generate slides. Try a different file.
              </span>
            )}
            {slides.length > 0 && (
              <div className={styles.slideStrip}>
                {slides.map((slide, index) => (
                  <img key={index} className={styles.slideThumb} src={slide.url} alt={`Slide ${index + 1}`} />
                ))}
              </div>
            )}
            <div className={imageStyles.footer} style={{ borderTop: "none", paddingTop: 0 }}>
              <span className={imageStyles.sizeCompare}>
                {slides.length} slide{slides.length === 1 ? "" : "s"} ready · {preset.width}×{preset.height} each
              </span>
              <button className={imageStyles.downloadButton} disabled={slides.length === 0 || processing} onClick={handleDownloadZip}>
                Download ZIP
              </button>
            </div>
          </div>
        }
      />
    </WorkspaceShell>
  );
}
