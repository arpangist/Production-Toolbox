import { useEffect, useRef, useState } from "react";
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
import { SIZE_PRESETS } from "../../../lib/sizePresets";
import { computeCoverRect } from "../../../lib/coverCrop";
import type { ImageFormat, ImageOpResult, SourceRect } from "../../../workers/imageProcessing.types";
import type { ToolDefinition } from "../../../types/tool";
import styles from "./ImageTool.module.css";

const BASE_FORMATS: ImageFormat[] = ["image/jpeg", "image/png", "image/webp"];

export default function ResizeWorkspace({ tool }: { tool: ToolDefinition }) {
  const { files, error, importFiles, reset } = useFileImport({ acceptedTypes: ["image/*"], multiple: false });
  const file = files[0] ?? null;
  const dimensions = useImageDimensions(file);
  const { run } = useImageProcessor();

  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [sourceRect, setSourceRect] = useState<SourceRect | null>(null);
  const [lockAspect, setLockAspect] = useState(true);
  const [format, setFormat] = useState<ImageFormat>("image/jpeg");
  const [quality, setQuality] = useState(90);
  const [availableFormats, setAvailableFormats] = useState<ImageFormat[]>(BASE_FORMATS);

  const [result, setResult] = useState<ImageOpResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [processError, setProcessError] = useState<string | null>(null);

  const aspectRatio = useRef(1);
  const cancelRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    supportsAvifEncoding().then((ok) => {
      if (ok) setAvailableFormats([...BASE_FORMATS, "image/avif"]);
    });
  }, []);

  useEffect(() => {
    if (!dimensions) return;
    setWidth(dimensions.width);
    setHeight(dimensions.height);
    setSourceRect(null);
    aspectRatio.current = dimensions.width / dimensions.height;
  }, [dimensions]);

  useEffect(() => {
    if (file && BASE_FORMATS.includes(file.type as ImageFormat)) {
      setFormat(file.type as ImageFormat);
    }
  }, [file]);

  const debouncedWidth = useDebouncedValue(width, 300);
  const debouncedHeight = useDebouncedValue(height, 300);
  const debouncedSourceRect = useDebouncedValue(sourceRect, 300);
  const debouncedFormat = useDebouncedValue(format, 300);
  const debouncedQuality = useDebouncedValue(quality, 300);

  useEffect(() => {
    if (!file || debouncedWidth <= 0 || debouncedHeight <= 0) return;

    cancelRef.current?.();
    setProcessing(true);
    setProgress(0);
    setProcessError(null);

    const handle = run<ImageOpResult>(
      {
        op: "resize",
        file,
        width: Math.round(debouncedWidth),
        height: Math.round(debouncedHeight),
        sourceRect: debouncedSourceRect ?? undefined,
        format: debouncedFormat,
        quality: debouncedQuality / 100,
      },
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
  }, [file, debouncedWidth, debouncedHeight, debouncedSourceRect, debouncedFormat, debouncedQuality, run]);

  const resultUrl = useObjectUrl(result?.blob ?? null);

  const setWidthLocked = (next: number) => {
    setWidth(next);
    setSourceRect(null);
    if (lockAspect && aspectRatio.current) setHeight(Math.round(next / aspectRatio.current));
  };

  const setHeightLocked = (next: number) => {
    setHeight(next);
    setSourceRect(null);
    if (lockAspect && aspectRatio.current) setWidth(Math.round(next * aspectRatio.current));
  };

  const applyPercentage = (percent: number) => {
    if (!dimensions) return;
    setWidth(Math.round((dimensions.width * percent) / 100));
    setHeight(Math.round((dimensions.height * percent) / 100));
    setSourceRect(null);
  };

  const applyPreset = (presetWidth: number, presetHeight: number) => {
    // Presets are a deliverable spec (e.g. Instagram Square must come out
    // 1080×1080) — center-crop to the target ratio first, like `object-fit:
    // cover`, so the output always matches exactly with no distortion.
    if (dimensions) {
      setSourceRect(computeCoverRect(dimensions.width, dimensions.height, presetWidth, presetHeight));
    }
    setWidth(presetWidth);
    setHeight(presetHeight);
  };

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
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Dimensions</span>
              <div className={styles.row}>
                <input
                  className={styles.input}
                  type="number"
                  min={1}
                  value={width}
                  aria-label="Width in pixels"
                  onChange={(e) => setWidthLocked(Number(e.target.value))}
                />
                <span aria-hidden="true">×</span>
                <input
                  className={styles.input}
                  type="number"
                  min={1}
                  value={height}
                  aria-label="Height in pixels"
                  onChange={(e) => setHeightLocked(Number(e.target.value))}
                />
              </div>
              <label className={styles.checkboxRow}>
                <input type="checkbox" checked={lockAspect} onChange={(e) => setLockAspect(e.target.checked)} />
                Lock aspect ratio
              </label>
            </div>

            <div className={styles.field}>
              <span className={styles.fieldLabel}>Scale</span>
              <div className={styles.chipRow}>
                {[25, 50, 75, 100].map((percent) => (
                  <button key={percent} className={styles.chip} onClick={() => applyPercentage(percent)}>
                    {percent}%
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.field}>
              <span className={styles.fieldLabel}>Presets</span>
              <div className={styles.chipRow}>
                {SIZE_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    className={styles.chip}
                    data-active={width === preset.width && height === preset.height}
                    onClick={() => applyPreset(preset.width, preset.height)}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.field}>
              <span className={styles.fieldLabel}>Format</span>
              <select className={styles.select} value={format} onChange={(e) => setFormat(e.target.value as ImageFormat)}>
                {availableFormats.map((f) => (
                  <option key={f} value={f}>
                    {FORMAT_LABELS[f]}
                  </option>
                ))}
              </select>
            </div>

            {supportsQuality(format) && (
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Quality — {quality}%</span>
                <input
                  className={styles.slider}
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
          <div className={styles.previewArea}>
            {resultUrl ? (
              <img className={styles.previewImage} src={resultUrl} alt="Resized preview" />
            ) : (
              <span className={styles.statusRow}>{processing ? "Processing…" : "Waiting for input"}</span>
            )}
          </div>
        }
        footer={
          <div className={styles.footer}>
            <div className={styles.sizeCompare}>
              {file && <span>Original {formatBytes(file.size)}</span>}
              {result && <span>Output {formatBytes(result.blob.size)}</span>}
              {processing && (
                <span className={styles.statusRow} role="status" aria-live="polite">
                  Processing… {Math.round(progress * 100)}%
                </span>
              )}
              {processError && (
                <span className={styles.errorText} role="alert">
                  This image couldn't be processed. Try a different file or format.
                </span>
              )}
            </div>
            <button className={styles.downloadButton} disabled={!result || processing} onClick={handleDownload}>
              Download
            </button>
          </div>
        }
      />
    </WorkspaceShell>
  );
}
