import { useEffect, useRef, useState } from "react";
import { useFileImport } from "../../../hooks/useFileImport";
import { useImageProcessor } from "../../../hooks/useImageProcessor";
import { useDebouncedValue } from "../../../hooks/useDebouncedValue";
import { useObjectUrl } from "../../../hooks/useObjectUrl";
import { WorkspaceShell } from "../../workspace/WorkspaceShell";
import { ImageToolLayout } from "../image/ImageToolLayout";
import { downloadBlob } from "../../../lib/downloadFile";
import { formatBytes } from "../../../lib/format";
import type { ImageOpResult } from "../../../workers/imageProcessing.types";
import type { ToolDefinition } from "../../../types/tool";
import imageStyles from "../image/ImageTool.module.css";

type Shape = "circle" | "square" | "line";

export default function HalftoneWorkspace({ tool }: { tool: ToolDefinition }) {
  const { files, error, importFiles, reset } = useFileImport({ acceptedTypes: ["image/*"], multiple: false });
  const file = files[0] ?? null;
  const { run } = useImageProcessor();

  const [cellSize, setCellSize] = useState(10);
  const [angle, setAngle] = useState(45);
  const [shape, setShape] = useState<Shape>("circle");
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [dotColor, setDotColor] = useState("#111111");

  const [result, setResult] = useState<ImageOpResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [processError, setProcessError] = useState<string | null>(null);
  const cancelRef = useRef<(() => void) | null>(null);

  const params = { cellSize, angle, shape, backgroundColor, dotColor };
  const debouncedParams = useDebouncedValue(params, 250);

  useEffect(() => {
    if (!file) return;
    cancelRef.current?.();
    setProcessing(true);
    setProgress(0);
    setProcessError(null);

    const handle = run<ImageOpResult>(
      { op: "halftone", file, format: "image/png", quality: 0.92, ...debouncedParams },
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
  }, [file, debouncedParams, run]);

  const resultUrl = useObjectUrl(result?.blob ?? null);

  const handleDownload = () => {
    if (!result || !file) return;
    downloadBlob(result.blob, file.name.replace(/\.[^./]+$/, "") + "-halftone.png");
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
              <span className={imageStyles.fieldLabel}>Shape</span>
              <div className={imageStyles.chipRow}>
                {(["circle", "square", "line"] as Shape[]).map((option) => (
                  <button key={option} className={imageStyles.chip} data-active={shape === option} onClick={() => setShape(option)}>
                    {option[0].toUpperCase() + option.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className={imageStyles.field}>
              <span className={imageStyles.fieldLabel}>Cell size — {cellSize}px</span>
              <input
                className={imageStyles.slider}
                type="range"
                min={4}
                max={40}
                value={cellSize}
                onChange={(e) => setCellSize(Number(e.target.value))}
              />
            </div>
            <div className={imageStyles.field}>
              <span className={imageStyles.fieldLabel}>Angle — {angle}°</span>
              <input className={imageStyles.slider} type="range" min={0} max={90} value={angle} onChange={(e) => setAngle(Number(e.target.value))} />
            </div>
            <div className={imageStyles.field}>
              <span className={imageStyles.fieldLabel}>Dot color</span>
              <input type="color" value={dotColor} onChange={(e) => setDotColor(e.target.value)} />
            </div>
            <div className={imageStyles.field}>
              <span className={imageStyles.fieldLabel}>Background color</span>
              <input type="color" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} />
            </div>
          </>
        }
        preview={
          <div className={imageStyles.previewArea}>
            {resultUrl ? (
              <img className={imageStyles.previewImage} src={resultUrl} alt="Halftone preview" />
            ) : (
              <span className={imageStyles.statusRow}>{processing ? "Processing…" : "Waiting for input"}</span>
            )}
          </div>
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
              {processError && <span className={imageStyles.errorText}>This image couldn't be processed.</span>}
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
