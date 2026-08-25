import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useFileImport } from "../../../hooks/useFileImport";
import { useImageDimensions } from "../../../hooks/useImageDimensions";
import { useImageProcessor } from "../../../hooks/useImageProcessor";
import { useDebouncedValue } from "../../../hooks/useDebouncedValue";
import { useObjectUrl } from "../../../hooks/useObjectUrl";
import { WorkspaceShell } from "../../workspace/WorkspaceShell";
import { ImageToolLayout } from "./ImageToolLayout";
import { downloadBlob } from "../../../lib/downloadFile";
import { formatBytes } from "../../../lib/format";
import { FORMAT_LABELS, supportsAvifEncoding, supportsQuality, withExtension } from "../../../lib/imageFormat";
import type { ImageFormat, ImageOpResult } from "../../../workers/imageProcessing.types";
import type { ToolDefinition } from "../../../types/tool";
import imageStyles from "./ImageTool.module.css";
import styles from "./CropWorkspace.module.css";

const BASE_FORMATS: ImageFormat[] = ["image/jpeg", "image/png", "image/webp"];
const MAX_PREVIEW_WIDTH = 520;
const MAX_PREVIEW_HEIGHT = 460;

type RatioKey = "free" | "1:1" | "4:5" | "9:16" | "16:9" | "custom";

const RATIO_OPTIONS: { key: RatioKey; label: string }[] = [
  { key: "free", label: "Free" },
  { key: "1:1", label: "1:1" },
  { key: "4:5", label: "4:5" },
  { key: "9:16", label: "9:16" },
  { key: "16:9", label: "16:9" },
  { key: "custom", label: "Custom" },
];

export default function CropWorkspace({ tool }: { tool: ToolDefinition }) {
  const { files, error, importFiles, reset } = useFileImport({ acceptedTypes: ["image/*"], multiple: false });
  const file = files[0] ?? null;
  const dimensions = useImageDimensions(file);
  const originalUrl = useObjectUrl(file);
  const { run } = useImageProcessor();

  const [ratioKey, setRatioKey] = useState<RatioKey>("1:1");
  const [customW, setCustomW] = useState(3);
  const [customH, setCustomH] = useState(2);
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState({ x: 0.5, y: 0.5 }); // normalized 0-1
  const [format, setFormat] = useState<ImageFormat>("image/jpeg");
  const [quality, setQuality] = useState(90);
  const [availableFormats, setAvailableFormats] = useState<ImageFormat[]>(BASE_FORMATS);

  const [result, setResult] = useState<ImageOpResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [processError, setProcessError] = useState<string | null>(null);

  const cancelRef = useRef<(() => void) | null>(null);
  const dragState = useRef<{ startX: number; startY: number; startCenter: { x: number; y: number } } | null>(null);

  useEffect(() => {
    supportsAvifEncoding().then((ok) => {
      if (ok) setAvailableFormats([...BASE_FORMATS, "image/avif"]);
    });
  }, []);

  useEffect(() => {
    if (file && BASE_FORMATS.includes(file.type as ImageFormat)) setFormat(file.type as ImageFormat);
  }, [file]);

  // Reset the focal point whenever the target ratio changes.
  useEffect(() => {
    setCenter({ x: 0.5, y: 0.5 });
    setZoom(1);
  }, [ratioKey, customW, customH]);

  const targetRatio = useMemo(() => {
    if (!dimensions) return 1;
    if (ratioKey === "free") return dimensions.width / dimensions.height;
    if (ratioKey === "custom") return customW / Math.max(1, customH);
    const [w, h] = ratioKey.split(":").map(Number);
    return w / h;
  }, [ratioKey, customW, customH, dimensions]);

  const preview = useMemo(() => {
    if (!dimensions) return null;
    const scale = Math.min(1, MAX_PREVIEW_WIDTH / dimensions.width, MAX_PREVIEW_HEIGHT / dimensions.height);
    const width = Math.round(dimensions.width * scale);
    const height = Math.round(dimensions.height * scale);

    const inscribedW = targetRatio > width / height ? width : height * targetRatio;
    const inscribedH = targetRatio > width / height ? width / targetRatio : height;
    const cropW = Math.min(width, inscribedW / zoom);
    const cropH = Math.min(height, inscribedH / zoom);

    const halfW = cropW / 2;
    const halfH = cropH / 2;
    const cx = Math.min(width - halfW, Math.max(halfW, center.x * width));
    const cy = Math.min(height - halfH, Math.max(halfH, center.y * height));

    return { width, height, cropW, cropH, cropX: cx - halfW, cropY: cy - halfH, scale };
  }, [dimensions, targetRatio, zoom, center]);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!preview) return;
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
    dragState.current = { startX: event.clientX, startY: event.clientY, startCenter: { ...center } };
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragState.current || !preview) return;
    const dx = event.clientX - dragState.current.startX;
    const dy = event.clientY - dragState.current.startY;
    const nextX = dragState.current.startCenter.x + dx / preview.width;
    const nextY = dragState.current.startCenter.y + dy / preview.height;
    setCenter({ x: Math.min(1, Math.max(0, nextX)), y: Math.min(1, Math.max(0, nextY)) });
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).hasPointerCapture(event.pointerId)) {
      (event.target as HTMLElement).releasePointerCapture(event.pointerId);
    }
    dragState.current = null;
  };

  const debouncedFormat = useDebouncedValue(format, 250);
  const debouncedQuality = useDebouncedValue(quality, 250);
  const debouncedPreview = useDebouncedValue(preview, 200);

  useEffect(() => {
    if (!file || !dimensions || !debouncedPreview) return;

    const scaleToNatural = dimensions.width / debouncedPreview.width;
    const x = Math.round(debouncedPreview.cropX * scaleToNatural);
    const y = Math.round(debouncedPreview.cropY * scaleToNatural);
    const width = Math.round(debouncedPreview.cropW * scaleToNatural);
    const height = Math.round(debouncedPreview.cropH * scaleToNatural);
    if (width <= 0 || height <= 0) return;

    cancelRef.current?.();
    setProcessing(true);
    setProgress(0);
    setProcessError(null);

    const handle = run<ImageOpResult>(
      { op: "crop", file, x, y, width, height, format: debouncedFormat, quality: debouncedQuality / 100 },
      setProgress,
    );
    cancelRef.current = handle.cancel;

    handle.promise
      .then((res) => {
        setResult(res);
        setProcessing(false);
      })
      .catch((err: Error) => {
        if (err.message === "Cancelled") return;
        setProcessError(err.message);
        setProcessing(false);
      });

    return () => handle.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, dimensions, debouncedPreview, debouncedFormat, debouncedQuality, run]);

  const resultUrl = useObjectUrl(result?.blob ?? null);

  const handleDownload = () => {
    if (!result || !file) return;
    downloadBlob(result.blob, withExtension(file.name, format));
  };

  const handleChangeFile = () => {
    reset();
    setResult(null);
  };

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
              <span className={imageStyles.fieldLabel}>Ratio</span>
              <div className={imageStyles.chipRow}>
                {RATIO_OPTIONS.map((option) => (
                  <button
                    key={option.key}
                    className={imageStyles.chip}
                    data-active={ratioKey === option.key}
                    onClick={() => setRatioKey(option.key)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {ratioKey === "custom" && (
                <div className={styles.customRow}>
                  <input
                    className={imageStyles.input}
                    type="number"
                    min={1}
                    value={customW}
                    aria-label="Custom ratio width"
                    onChange={(e) => setCustomW(Number(e.target.value))}
                  />
                  <span aria-hidden="true">:</span>
                  <input
                    className={imageStyles.input}
                    type="number"
                    min={1}
                    value={customH}
                    aria-label="Custom ratio height"
                    onChange={(e) => setCustomH(Number(e.target.value))}
                  />
                </div>
              )}
            </div>

            <div className={imageStyles.field}>
              <span className={imageStyles.fieldLabel}>Zoom — {zoom.toFixed(1)}×</span>
              <input
                className={imageStyles.slider}
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                aria-label="Zoom"
              />
              <span className={styles.ratioLabel}>Drag the crop window on the image to reposition it.</span>
            </div>

            <div className={imageStyles.field}>
              <span className={imageStyles.fieldLabel}>Format</span>
              <select className={imageStyles.select} value={format} onChange={(e) => setFormat(e.target.value as ImageFormat)}>
                {availableFormats.map((f) => (
                  <option key={f} value={f}>
                    {FORMAT_LABELS[f]}
                  </option>
                ))}
              </select>
            </div>

            {supportsQuality(format) && (
              <div className={imageStyles.field}>
                <span className={imageStyles.fieldLabel}>Quality — {quality}%</span>
                <input
                  className={imageStyles.slider}
                  type="range"
                  min={1}
                  max={100}
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  aria-label="Quality"
                />
              </div>
            )}
          </>
        }
        preview={
          <>
            <div className={styles.stageWrap}>
              {preview && originalUrl && (
                <div className={styles.stage} style={{ width: preview.width, height: preview.height }}>
                  <img className={styles.image} src={originalUrl} width={preview.width} height={preview.height} alt="Source" draggable={false} />
                  <div
                    className={styles.cropBox}
                    style={{
                      left: preview.cropX,
                      top: preview.cropY,
                      width: preview.cropW,
                      height: preview.cropH,
                    }}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    role="slider"
                    aria-label="Crop focal position"
                    aria-valuetext={`${Math.round(center.x * 100)}%, ${Math.round(center.y * 100)}%`}
                    tabIndex={0}
                  />
                </div>
              )}
            </div>
            {resultUrl && (
              <div className={imageStyles.previewArea} style={{ marginTop: "var(--space-3)", minHeight: "auto" }}>
                <img className={imageStyles.previewImage} src={resultUrl} alt="Cropped result" style={{ maxHeight: 200 }} />
              </div>
            )}
          </>
        }
        footer={
          <div className={imageStyles.footer}>
            <div className={imageStyles.sizeCompare}>
              {file && <span>Original {formatBytes(file.size)}</span>}
              {result && (
                <span>
                  Output {formatBytes(result.blob.size)} · {result.width}×{result.height}
                </span>
              )}
              {processing && (
                <span className={imageStyles.statusRow} role="status" aria-live="polite">
                  Processing… {Math.round(progress * 100)}%
                </span>
              )}
              {processError && (
                <span className={imageStyles.errorText} role="alert">
                  This image couldn't be cropped. Try a different file or format.
                </span>
              )}
            </div>
            <button className={imageStyles.downloadButton} disabled={!result || processing} onClick={handleDownload}>
              Download
            </button>
          </div>
        }
      />
    </WorkspaceShell>
  );
}
