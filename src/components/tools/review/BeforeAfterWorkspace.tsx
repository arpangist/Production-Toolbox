import { useEffect, useRef, useState } from "react";
import { useObjectUrl } from "../../../hooks/useObjectUrl";
import { renderBeforeAfter, type BeforeAfterConfig } from "../../../lib/beforeAfterExport";
import { downloadBlob } from "../../../lib/downloadFile";
import { DropZone } from "../../fileengine/DropZone";
import { WorkspaceShell } from "../../workspace/WorkspaceShell";
import type { ToolDefinition } from "../../../types/tool";
import imageStyles from "../image/ImageTool.module.css";
import styles from "./BeforeAfterWorkspace.module.css";

export default function BeforeAfterWorkspace({ tool }: { tool: ToolDefinition }) {
  const [fileA, setFileA] = useState<File | null>(null);
  const [fileB, setFileB] = useState<File | null>(null);
  const urlA = useObjectUrl(fileA);
  const urlB = useObjectUrl(fileB);

  const [mode, setMode] = useState<BeforeAfterConfig["mode"]>("split");
  const [dividerPercent, setDividerPercent] = useState(50);
  const [labelBefore, setLabelBefore] = useState("BEFORE");
  const [labelAfter, setLabelAfter] = useState("AFTER");
  const [showLabels, setShowLabels] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    if (!fileA || !fileB || !canvasRef.current) return;
    setRenderError(null);
    renderBeforeAfter(fileA, fileB, { mode, dividerPercent, labelBefore, labelAfter, showLabels })
      .then((canvas) => {
        const target = canvasRef.current;
        if (!target) return;
        target.width = canvas.width;
        target.height = canvas.height;
        const ctx = target.getContext("2d");
        ctx?.drawImage(canvas, 0, 0);
      })
      .catch((err: Error) => setRenderError(err.message));
  }, [fileA, fileB, mode, dividerPercent, labelBefore, labelAfter, showLabels]);

  const handleDownload = () => {
    canvasRef.current?.toBlob((blob) => {
      if (blob) downloadBlob(blob, "before-after.png");
    }, "image/png");
  };

  const bothLoaded = !!fileA && !!fileB;

  return (
    <WorkspaceShell title={tool.name}>
      <div className={styles.slots}>
        <div className={styles.slot}>
          {urlA ? (
            <>
              <span className={styles.slotLabel}>Before</span>
              <img className={styles.slotImage} src={urlA} alt="Before" />
            </>
          ) : (
            <DropZone label="Before image" accept="image/*" multiple={false} onFiles={(files) => setFileA(files[0])} />
          )}
        </div>
        <div className={styles.slot}>
          {urlB ? (
            <>
              <span className={styles.slotLabel}>After</span>
              <img className={styles.slotImage} src={urlB} alt="After" />
            </>
          ) : (
            <DropZone label="After image" accept="image/*" multiple={false} onFiles={(files) => setFileB(files[0])} />
          )}
        </div>
      </div>

      {(fileA || fileB) && (
        <div className={imageStyles.chipRow} style={{ marginBottom: "var(--space-4)" }}>
          {fileA && (
            <button className={imageStyles.chip} onClick={() => setFileA(null)}>
              Change Before
            </button>
          )}
          {fileB && (
            <button className={imageStyles.chip} onClick={() => setFileB(null)}>
              Change After
            </button>
          )}
        </div>
      )}

      {bothLoaded && (
        <>
          <div className={imageStyles.layout}>
            <div className={imageStyles.settings}>
              <div className={imageStyles.field}>
                <span className={imageStyles.fieldLabel}>Layout</span>
                <div className={imageStyles.chipRow}>
                  <button className={imageStyles.chip} data-active={mode === "split"} onClick={() => setMode("split")}>
                    Split Reveal
                  </button>
                  <button className={imageStyles.chip} data-active={mode === "side-by-side"} onClick={() => setMode("side-by-side")}>
                    Side-by-Side
                  </button>
                </div>
              </div>

              {mode === "split" && (
                <div className={imageStyles.field}>
                  <span className={imageStyles.fieldLabel}>Split position — {dividerPercent}%</span>
                  <input
                    className={imageStyles.slider}
                    type="range"
                    min={5}
                    max={95}
                    value={dividerPercent}
                    onChange={(e) => setDividerPercent(Number(e.target.value))}
                  />
                </div>
              )}

              <label className={imageStyles.checkboxRow}>
                <input type="checkbox" checked={showLabels} onChange={(e) => setShowLabels(e.target.checked)} />
                Show labels
              </label>

              {showLabels && (
                <>
                  <div className={imageStyles.field}>
                    <span className={imageStyles.fieldLabel}>Before label</span>
                    <input className={imageStyles.input} value={labelBefore} onChange={(e) => setLabelBefore(e.target.value)} />
                  </div>
                  <div className={imageStyles.field}>
                    <span className={imageStyles.fieldLabel}>After label</span>
                    <input className={imageStyles.input} value={labelAfter} onChange={(e) => setLabelAfter(e.target.value)} />
                  </div>
                </>
              )}
            </div>

            <div>
              <div className={styles.canvasWrap}>
                <canvas ref={canvasRef} />
              </div>
              {renderError && <p className={imageStyles.errorText}>{renderError}</p>}
            </div>
          </div>

          <div className={imageStyles.footer} style={{ marginTop: "var(--space-4)" }}>
            <span className={imageStyles.statusRow}>Composed as one flat PNG, ready to share.</span>
            <button className={imageStyles.downloadButton} onClick={handleDownload}>
              Download PNG
            </button>
          </div>
        </>
      )}
    </WorkspaceShell>
  );
}
