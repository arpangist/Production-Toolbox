import { useEffect, useRef, useState } from "react";
import { useFileImport } from "../../../hooks/useFileImport";
import { useImageProcessor } from "../../../hooks/useImageProcessor";
import { useDebouncedValue } from "../../../hooks/useDebouncedValue";
import { useObjectUrl } from "../../../hooks/useObjectUrl";
import { WorkspaceShell } from "../../workspace/WorkspaceShell";
import { ImageToolLayout } from "../image/ImageToolLayout";
import { downloadBlob } from "../../../lib/downloadFile";
import { formatBytes } from "../../../lib/format";
import { withExtension } from "../../../lib/imageFormat";
import type { ImageOpResult } from "../../../workers/imageProcessing.types";
import type { ToolDefinition } from "../../../types/tool";
import imageStyles from "../image/ImageTool.module.css";

const PRESETS: { label: string; shadow: string; highlight: string }[] = [
  { label: "Navy / Coral", shadow: "#1a1a3e", highlight: "#ff6b6b" },
  { label: "Ink / Gold", shadow: "#0d0d0d", highlight: "#f6c453" },
  { label: "Teal / Cream", shadow: "#0f3d3e", highlight: "#f6efe2" },
  { label: "Plum / Mint", shadow: "#3a1c4a", highlight: "#8ee3c8" },
];

export default function DuotoneWorkspace({ tool }: { tool: ToolDefinition }) {
  const { files, error, importFiles, reset } = useFileImport({ acceptedTypes: ["image/*"], multiple: false });
  const file = files[0] ?? null;
  const { run } = useImageProcessor();

  const [shadowColor, setShadowColor] = useState(PRESETS[0].shadow);
  const [highlightColor, setHighlightColor] = useState(PRESETS[0].highlight);

  const [result, setResult] = useState<ImageOpResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [processError, setProcessError] = useState<string | null>(null);
  const cancelRef = useRef<(() => void) | null>(null);

  const debouncedShadow = useDebouncedValue(shadowColor, 200);
  const debouncedHighlight = useDebouncedValue(highlightColor, 200);

  useEffect(() => {
    if (!file) return;

    cancelRef.current?.();
    setProcessing(true);
    setProgress(0);
    setProcessError(null);

    const handle = run<ImageOpResult>(
      {
        op: "duotone",
        file,
        shadowColor: debouncedShadow,
        highlightColor: debouncedHighlight,
        format: "image/jpeg",
        quality: 0.92,
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
  }, [file, debouncedShadow, debouncedHighlight, run]);

  const resultUrl = useObjectUrl(result?.blob ?? null);

  const handleDownload = () => {
    if (!result || !file) return;
    downloadBlob(result.blob, withExtension(file.name, "image/jpeg"));
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
              <span className={imageStyles.fieldLabel}>Presets</span>
              <div className={imageStyles.chipRow}>
                {PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    className={imageStyles.chip}
                    data-active={shadowColor === preset.shadow && highlightColor === preset.highlight}
                    onClick={() => {
                      setShadowColor(preset.shadow);
                      setHighlightColor(preset.highlight);
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={imageStyles.field}>
              <span className={imageStyles.fieldLabel}>Shadow color</span>
              <div className={imageStyles.row}>
                <input type="color" value={shadowColor} onChange={(e) => setShadowColor(e.target.value)} aria-label="Shadow color" />
                <span className="mono">{shadowColor}</span>
              </div>
            </div>

            <div className={imageStyles.field}>
              <span className={imageStyles.fieldLabel}>Highlight color</span>
              <div className={imageStyles.row}>
                <input type="color" value={highlightColor} onChange={(e) => setHighlightColor(e.target.value)} aria-label="Highlight color" />
                <span className="mono">{highlightColor}</span>
              </div>
            </div>
          </>
        }
        preview={
          <div className={imageStyles.previewArea}>
            {resultUrl ? (
              <img className={imageStyles.previewImage} src={resultUrl} alt="Duotone preview" />
            ) : (
              <span className={imageStyles.statusRow}>{processing ? "Processing…" : "Waiting for input"}</span>
            )}
          </div>
        }
        footer={
          <div className={imageStyles.footer}>
            <div className={imageStyles.sizeCompare}>
              {file && <span>Original {formatBytes(file.size)}</span>}
              {result && <span>Output {formatBytes(result.blob.size)}</span>}
              {processing && (
                <span className={imageStyles.statusRow} role="status" aria-live="polite">
                  Processing… {Math.round(progress * 100)}%
                </span>
              )}
              {processError && (
                <span className={imageStyles.errorText} role="alert">
                  This image couldn't be processed. Try a different file.
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
