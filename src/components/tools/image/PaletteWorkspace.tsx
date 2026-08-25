import { useEffect, useRef, useState } from "react";
import { useFileImport } from "../../../hooks/useFileImport";
import { useImageProcessor } from "../../../hooks/useImageProcessor";
import { useObjectUrl } from "../../../hooks/useObjectUrl";
import { WorkspaceShell } from "../../workspace/WorkspaceShell";
import { ImageToolLayout } from "./ImageToolLayout";
import { downloadBlob } from "../../../lib/downloadFile";
import type { PaletteResult } from "../../../workers/imageProcessing.types";
import type { ToolDefinition } from "../../../types/tool";
import imageStyles from "./ImageTool.module.css";
import styles from "./PaletteWorkspace.module.css";

export default function PaletteWorkspace({ tool }: { tool: ToolDefinition }) {
  const { files, error, importFiles, reset } = useFileImport({ acceptedTypes: ["image/*"], multiple: false });
  const file = files[0] ?? null;
  const { run } = useImageProcessor();
  const originalUrl = useObjectUrl(file);

  const [colorCount, setColorCount] = useState(6);
  const [result, setResult] = useState<PaletteResult | null>(null);
  const [processing, setProcessing] = useState(false);
  const [processError, setProcessError] = useState<string | null>(null);
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);
  const cancelRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!file) return;

    cancelRef.current?.();
    setProcessing(true);
    setProcessError(null);

    const handle = run<PaletteResult>({ op: "palette", file, colorCount });
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
  }, [file, colorCount, run]);

  const copy = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedLabel(label);
    setTimeout(() => setCopiedLabel((current) => (current === label ? null : current)), 1500);
  };

  const asCssVariables = () =>
    result
      ? `:root {\n${result.colors.map((c, i) => `  --palette-${i + 1}: ${c.hex};`).join("\n")}\n}`
      : "";

  const asJson = () => (result ? JSON.stringify(result.colors, null, 2) : "");

  const handleDownloadJson = () => {
    if (!result) return;
    downloadBlob(new Blob([asJson()], { type: "application/json" }), "palette.json");
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
              <span className={imageStyles.fieldLabel}>Colors — {colorCount}</span>
              <input
                className={imageStyles.slider}
                type="range"
                min={3}
                max={10}
                value={colorCount}
                onChange={(e) => setColorCount(Number(e.target.value))}
                aria-label="Number of colors"
              />
            </div>
            <div className={styles.actions}>
              <button className={styles.copyButton} disabled={!result} onClick={() => copy(asCssVariables(), "css")}>
                {copiedLabel === "css" ? "Copied!" : "Copy CSS variables"}
              </button>
            </div>
            <div className={styles.actions}>
              <button className={styles.copyButton} disabled={!result} onClick={() => copy(asJson(), "json")}>
                {copiedLabel === "json" ? "Copied!" : "Copy JSON"}
              </button>
              <button className={styles.copyButton} disabled={!result} onClick={handleDownloadJson}>
                Download JSON
              </button>
            </div>
          </>
        }
        preview={
          <div className={imageStyles.previewArea}>
            {originalUrl && <img className={imageStyles.previewImage} src={originalUrl} alt="Source" />}
          </div>
        }
        footer={
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", width: "100%" }}>
            {processing && (
              <span className={imageStyles.statusRow} role="status" aria-live="polite">
                Extracting palette…
              </span>
            )}
            {processError && (
              <span className={imageStyles.errorText} role="alert">
                Couldn't extract a palette from this image. Try a different file.
              </span>
            )}
            {result && (
              <div className={styles.swatchGrid}>
                {result.colors.map((color) => (
                  <button
                    key={color.hex}
                    className={styles.swatch}
                    onClick={() => copy(color.hex, color.hex)}
                    aria-label={`Copy ${color.hex}`}
                  >
                    <div className={styles.swatchColor} style={{ background: color.hex }} />
                    <div className={styles.swatchInfo}>
                      <span className={styles.swatchHex}>{copiedLabel === color.hex ? "Copied!" : color.hex}</span>
                      <span className={styles.swatchDetail}>
                        rgb({color.rgb.join(", ")})
                      </span>
                      <span className={styles.swatchDetail}>
                        hsl({color.hsl[0]}, {color.hsl[1]}%, {color.hsl[2]}%)
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        }
      />
    </WorkspaceShell>
  );
}
