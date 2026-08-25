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

export default function LongShadowWorkspace({ tool }: { tool: ToolDefinition }) {
  const { files, error, importFiles, reset } = useFileImport({ acceptedTypes: ["image/*"], multiple: false });
  const file = files[0] ?? null;
  const { run } = useImageProcessor();

  const [angle, setAngle] = useState(45);
  const [length, setLength] = useState(200);
  const [opacity, setOpacity] = useState(60);
  const [color, setColor] = useState("#111111");
  const [fade, setFade] = useState(true);

  const [result, setResult] = useState<ImageOpResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [processError, setProcessError] = useState<string | null>(null);
  const cancelRef = useRef<(() => void) | null>(null);

  const params = { angle, length, opacity: opacity / 100, color, fade };
  const debouncedParams = useDebouncedValue(params, 200);

  useEffect(() => {
    if (!file) return;
    cancelRef.current?.();
    setProcessing(true);
    setProgress(0);
    setProcessError(null);

    const handle = run<ImageOpResult>(
      { op: "longShadow", file, format: "image/png", quality: 0.92, ...debouncedParams },
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
    downloadBlob(result.blob, file.name.replace(/\.[^./]+$/, "") + "-long-shadow.png");
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
              <span className={imageStyles.fieldLabel}>Angle — {angle}°</span>
              <input className={imageStyles.slider} type="range" min={0} max={360} value={angle} onChange={(e) => setAngle(Number(e.target.value))} />
            </div>
            <div className={imageStyles.field}>
              <span className={imageStyles.fieldLabel}>Length — {length}px</span>
              <input
                className={imageStyles.slider}
                type="range"
                min={0}
                max={600}
                value={length}
                onChange={(e) => setLength(Number(e.target.value))}
              />
            </div>
            <div className={imageStyles.field}>
              <span className={imageStyles.fieldLabel}>Opacity — {opacity}%</span>
              <input
                className={imageStyles.slider}
                type="range"
                min={0}
                max={100}
                value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))}
              />
            </div>
            <div className={imageStyles.field}>
              <span className={imageStyles.fieldLabel}>Color</span>
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
            </div>
            <label className={imageStyles.checkboxRow}>
              <input type="checkbox" checked={fade} onChange={(e) => setFade(e.target.checked)} />
              Fade toward the tip
            </label>
          </>
        }
        preview={
          <div className={imageStyles.previewArea}>
            {resultUrl ? (
              <img className={imageStyles.previewImage} src={resultUrl} alt="Long shadow preview" />
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
