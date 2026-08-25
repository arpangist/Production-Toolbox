import { useEffect, useRef, useState } from "react";
import { useFileImport } from "../../../hooks/useFileImport";
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
import styles from "./ImageTool.module.css";

const BASE_FORMATS: ImageFormat[] = ["image/jpeg", "image/png", "image/webp"];
const DEFAULT_QUALITY = 90;

export default function EncodeWorkspace({ tool }: { tool: ToolDefinition }) {
  const mode: "compress" | "convert" = tool.id === "image-compress" ? "compress" : "convert";

  const { files, error, importFiles, reset } = useFileImport({ acceptedTypes: ["image/*"], multiple: false });
  const file = files[0] ?? null;
  const { run } = useImageProcessor();

  const [format, setFormat] = useState<ImageFormat>("image/jpeg");
  const [quality, setQuality] = useState(DEFAULT_QUALITY);
  const [availableFormats, setAvailableFormats] = useState<ImageFormat[]>(BASE_FORMATS);

  const [result, setResult] = useState<ImageOpResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [processError, setProcessError] = useState<string | null>(null);

  const cancelRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    supportsAvifEncoding().then((ok) => {
      if (ok) setAvailableFormats([...BASE_FORMATS, "image/avif"]);
    });
  }, []);

  // Default the format to the imported file's own type, without an effect —
  // this is state derived from a prop change, adjusted during render.
  const [formatSourceFile, setFormatSourceFile] = useState<File | null>(null);
  if (file !== formatSourceFile) {
    setFormatSourceFile(file);
    if (file && BASE_FORMATS.includes(file.type as ImageFormat)) {
      setFormat(file.type as ImageFormat);
    }
  }

  const effectiveQuality = mode === "compress" ? quality : DEFAULT_QUALITY;
  const debouncedFormat = useDebouncedValue(format, 250);
  const debouncedQuality = useDebouncedValue(effectiveQuality, 250);

  useEffect(() => {
    if (!file) return;

    cancelRef.current?.();
    setProcessing(true);
    setProgress(0);
    setProcessError(null);

    const handle = run<ImageOpResult>(
      { op: "encode", file, format: debouncedFormat, quality: debouncedQuality / 100 },
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
  }, [file, debouncedFormat, debouncedQuality, run]);

  const originalUrl = useObjectUrl(file);
  const resultUrl = useObjectUrl(result?.blob ?? null);

  const handleDownload = () => {
    if (!result || !file) return;
    downloadBlob(result.blob, withExtension(file.name, format));
  };

  const handleChangeFile = () => {
    reset();
    setResult(null);
  };

  const reduction =
    file && result && file.size > 0 ? Math.round((1 - result.blob.size / file.size) * 100) : null;

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
              <span className={styles.fieldLabel}>Format</span>
              <select className={styles.select} value={format} onChange={(e) => setFormat(e.target.value as ImageFormat)}>
                {availableFormats.map((f) => (
                  <option key={f} value={f}>
                    {FORMAT_LABELS[f]}
                  </option>
                ))}
              </select>
            </div>

            {mode === "compress" && supportsQuality(format) && (
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
          mode === "compress" ? (
            <div className={styles.previewArea}>
              <div className={styles.previewSplit}>
                <div className={styles.previewPane}>
                  <span className={styles.previewPaneLabel}>Before</span>
                  {originalUrl && <img className={styles.previewImage} src={originalUrl} alt="Original" />}
                </div>
                <div className={styles.previewPane}>
                  <span className={styles.previewPaneLabel}>After</span>
                  {resultUrl ? (
                    <img className={styles.previewImage} src={resultUrl} alt="Compressed preview" />
                  ) : (
                    <span className={styles.statusRow}>{processing ? "Processing…" : "—"}</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.previewArea}>
              {resultUrl ? (
                <img className={styles.previewImage} src={resultUrl} alt="Converted preview" />
              ) : (
                <span className={styles.statusRow}>{processing ? "Processing…" : "Waiting for input"}</span>
              )}
            </div>
          )
        }
        footer={
          <div className={styles.footer}>
            <div className={styles.sizeCompare}>
              {file && <span>Original {formatBytes(file.size)}</span>}
              {result && <span>Output {formatBytes(result.blob.size)}</span>}
              {reduction !== null && reduction > 0 && <span className={styles.reduction}>-{reduction}%</span>}
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
