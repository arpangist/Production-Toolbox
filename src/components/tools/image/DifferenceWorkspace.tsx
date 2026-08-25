import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useObjectUrl } from "../../../hooks/useObjectUrl";
import { computeDifference } from "../../../lib/imageDiff";
import { downloadBlob } from "../../../lib/downloadFile";
import { DropZone } from "../../fileengine/DropZone";
import { WorkspaceShell } from "../../workspace/WorkspaceShell";
import type { ToolDefinition } from "../../../types/tool";
import imageStyles from "./ImageTool.module.css";
import styles from "./DifferenceWorkspace.module.css";

type Mode = "side-by-side" | "overlay" | "slider" | "difference" | "blink";

const MODES: { key: Mode; label: string }[] = [
  { key: "side-by-side", label: "Side-by-Side" },
  { key: "overlay", label: "Overlay" },
  { key: "slider", label: "Slider" },
  { key: "difference", label: "Difference" },
  { key: "blink", label: "Blink" },
];

export default function DifferenceWorkspace({ tool }: { tool: ToolDefinition }) {
  const [fileA, setFileA] = useState<File | null>(null);
  const [fileB, setFileB] = useState<File | null>(null);
  const urlA = useObjectUrl(fileA);
  const urlB = useObjectUrl(fileB);

  const [mode, setMode] = useState<Mode>("slider");
  const [overlayOpacity, setOverlayOpacity] = useState(50);
  const [sliderPos, setSliderPos] = useState(50);
  const [blinkShowA, setBlinkShowA] = useState(true);

  const [diffBlob, setDiffBlob] = useState<Blob | null>(null);
  const diffUrl = useObjectUrl(diffBlob);
  const [diffPercent, setDiffPercent] = useState<number | null>(null);
  const [diffProcessing, setDiffProcessing] = useState(false);
  const [diffError, setDiffError] = useState<string | null>(null);

  const dragging = useRef(false);
  const stageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (mode !== "blink" || !fileA || !fileB) return;
    const interval = setInterval(() => setBlinkShowA((prev) => !prev), 600);
    return () => clearInterval(interval);
  }, [mode, fileA, fileB]);

  useEffect(() => {
    if (mode !== "difference" || !fileA || !fileB) return;
    let cancelled = false;
    setDiffProcessing(true);
    setDiffError(null);
    computeDifference(fileA, fileB)
      .then((result) => {
        if (cancelled) return;
        setDiffBlob(result.blob);
        setDiffPercent(result.diffPercent);
      })
      .catch((err: Error) => {
        if (!cancelled) setDiffError(err.message);
      })
      .finally(() => {
        if (!cancelled) setDiffProcessing(false);
      });
    return () => {
      cancelled = true;
    };
  }, [mode, fileA, fileB]);

  const updateSliderFromClientX = (clientX: number) => {
    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    const percent = ((clientX - rect.left) / rect.width) * 100;
    setSliderPos(Math.min(100, Math.max(0, percent)));
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
    updateSliderFromClientX(event.clientX);
  };
  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    updateSliderFromClientX(event.clientX);
  };
  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    dragging.current = false;
    if ((event.target as HTMLElement).hasPointerCapture(event.pointerId)) {
      (event.target as HTMLElement).releasePointerCapture(event.pointerId);
    }
  };

  const handleDownloadDiff = () => {
    if (diffBlob) downloadBlob(diffBlob, "difference.png");
  };

  const bothLoaded = !!fileA && !!fileB;

  return (
    <WorkspaceShell title={tool.name}>
      <div className={styles.slots}>
        <div className={styles.slot}>
          {urlA ? (
            <>
              <span className={styles.slotLabel}>A</span>
              <img className={styles.slotImage} src={urlA} alt="Image A" />
            </>
          ) : (
            <DropZone label="Image A" accept="image/*" multiple={false} onFiles={(files) => setFileA(files[0])} />
          )}
        </div>
        <div className={styles.slot}>
          {urlB ? (
            <>
              <span className={styles.slotLabel}>B</span>
              <img className={styles.slotImage} src={urlB} alt="Image B" />
            </>
          ) : (
            <DropZone label="Image B" accept="image/*" multiple={false} onFiles={(files) => setFileB(files[0])} />
          )}
        </div>
      </div>

      {(fileA || fileB) && (
        <div className={imageStyles.row} style={{ marginTop: "var(--space-3)" }}>
          {fileA && (
            <button className={imageStyles.chip} onClick={() => setFileA(null)}>
              Change A
            </button>
          )}
          {fileB && (
            <button className={imageStyles.chip} onClick={() => setFileB(null)}>
              Change B
            </button>
          )}
        </div>
      )}

      {bothLoaded && (
        <>
          <div className={imageStyles.chipRow} style={{ marginTop: "var(--space-4)" }}>
            {MODES.map((option) => (
              <button key={option.key} className={imageStyles.chip} data-active={mode === option.key} onClick={() => setMode(option.key)}>
                {option.label}
              </button>
            ))}
          </div>

          <div className={styles.stage} style={{ marginTop: "var(--space-3)" }} ref={stageRef}>
            {mode === "side-by-side" && (
              <div className={styles.sideBySide}>
                <img src={urlA!} alt="Image A" />
                <img src={urlB!} alt="Image B" />
              </div>
            )}

            {mode === "overlay" && (
              <div className={styles.overlayStack}>
                <img src={urlA!} alt="Image A" />
                <img className={styles.overlayTop} src={urlB!} alt="Image B" style={{ opacity: overlayOpacity / 100 }} />
              </div>
            )}

            {mode === "slider" && (
              <div className={styles.sliderStage} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}>
                <img src={urlB!} alt="Image B" />
                <div className={styles.sliderTop} style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}>
                  <img src={urlA!} alt="Image A" />
                </div>
                <div className={styles.sliderHandle} style={{ left: `${sliderPos}%` }} />
              </div>
            )}

            {mode === "difference" && (
              <>
                {diffProcessing && <span className={imageStyles.statusRow}>Computing difference…</span>}
                {diffError && <span className={imageStyles.errorText}>{diffError}</span>}
                {diffUrl && !diffProcessing && <img className={styles.slotImage} style={{ maxHeight: 480 }} src={diffUrl} alt="Difference" />}
              </>
            )}

            {mode === "blink" && <img src={blinkShowA ? urlA! : urlB!} alt={blinkShowA ? "Image A" : "Image B"} style={{ maxWidth: "100%" }} />}
          </div>

          {mode === "overlay" && (
            <div className={imageStyles.field} style={{ marginTop: "var(--space-3)" }}>
              <span className={imageStyles.fieldLabel}>B opacity — {overlayOpacity}%</span>
              <input
                className={imageStyles.slider}
                type="range"
                min={0}
                max={100}
                value={overlayOpacity}
                onChange={(e) => setOverlayOpacity(Number(e.target.value))}
              />
            </div>
          )}

          {mode === "difference" && (
            <div className={imageStyles.footer} style={{ marginTop: "var(--space-3)" }}>
              <span className={imageStyles.sizeCompare}>
                {diffPercent !== null && <span>{diffPercent.toFixed(1)}% of pixels differ</span>}
              </span>
              <button className={imageStyles.downloadButton} disabled={!diffBlob} onClick={handleDownloadDiff}>
                Download PNG
              </button>
            </div>
          )}
        </>
      )}
    </WorkspaceShell>
  );
}
