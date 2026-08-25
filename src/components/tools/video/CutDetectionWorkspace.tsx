import { useState } from "react";
import { useFileImport } from "../../../hooks/useFileImport";
import { useVideoFile } from "../../../hooks/useVideoFile";
import { detectCuts, type CutDetectionResult } from "../../../lib/cutDetection";
import { formatTimestamp } from "../../../lib/video";
import { WorkspaceShell } from "../../workspace/WorkspaceShell";
import { VideoToolLayout } from "./VideoToolLayout";
import type { ToolDefinition } from "../../../types/tool";
import styles from "./VideoTool.module.css";

export default function CutDetectionWorkspace({ tool }: { tool: ToolDefinition }) {
  const { files, error, importFiles, reset } = useFileImport({ acceptedTypes: ["video/*"], multiple: false });
  const file = files[0] ?? null;
  const { videoRef, url, meta, error: videoError } = useVideoFile(file);

  const [sensitivity, setSensitivity] = useState(30);
  const [sampleInterval, setSampleInterval] = useState(0.5);
  const [result, setResult] = useState<CutDetectionResult | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [detectError, setDetectError] = useState<string | null>(null);

  const runDetection = async () => {
    const video = videoRef.current;
    if (!video || !meta) return;
    setDetecting(true);
    setDetectError(null);
    setProgress(0);
    try {
      const detection = await detectCuts(video, meta.duration, { sampleInterval, threshold: sensitivity }, setProgress);
      setResult(detection);
    } catch (err) {
      setDetectError(err instanceof Error ? err.message : "Couldn't analyze this video.");
    } finally {
      setDetecting(false);
    }
  };

  const handleChangeFile = () => {
    reset();
    setResult(null);
  };

  return (
    <WorkspaceShell title={tool.name}>
      <VideoToolLayout
        file={file}
        error={error}
        onFiles={importFiles}
        onChangeFile={handleChangeFile}
        settings={
          <>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Sensitivity — {sensitivity}</span>
              <input
                className={styles.slider}
                type="range"
                min={10}
                max={80}
                value={sensitivity}
                onChange={(e) => setSensitivity(Number(e.target.value))}
              />
              <span className={styles.statusRow}>Lower catches more cuts, including false positives.</span>
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Sample every — {sampleInterval.toFixed(2)}s</span>
              <input
                className={styles.slider}
                type="range"
                min={0.1}
                max={2}
                step={0.1}
                value={sampleInterval}
                onChange={(e) => setSampleInterval(Number(e.target.value))}
              />
            </div>
            <button className={styles.primaryButton} onClick={runDetection} disabled={!meta || detecting}>
              {detecting ? `Analyzing… ${Math.round(progress * 100)}%` : "Detect cuts"}
            </button>
            {detectError && <span className={styles.errorText}>{detectError}</span>}
          </>
        }
        preview={
          <div>
            <div className={styles.stage}>{url && <video ref={videoRef} src={url} className={styles.video} muted playsInline />}</div>
            {videoError && <p className={styles.errorText}>{videoError}</p>}
            {meta && result && (
              <div style={{ position: "relative", height: 8, marginTop: "var(--space-3)", background: "var(--color-border)", borderRadius: 4 }}>
                {result.cutTimestamps.map((t) => (
                  <div
                    key={t}
                    style={{ position: "absolute", top: 0, bottom: 0, width: 2, background: "var(--color-error)", left: `${(t / meta.duration) * 100}%` }}
                  />
                ))}
              </div>
            )}
          </div>
        }
        footer={
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", width: "100%" }}>
            {result ? (
              <>
                <span className={styles.statusRow}>{result.shots.length} shots detected</span>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 220, overflowY: "auto" }}>
                  {result.shots.map((shot, index) => (
                    <div key={index} style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }} className="mono">
                      <span>Shot {String(index + 1).padStart(2, "0")}</span>
                      <span>
                        {formatTimestamp(shot.start)} → {formatTimestamp(shot.end)} ({formatTimestamp(shot.end - shot.start)})
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <span className={styles.statusRow}>Run detection to see the shot list.</span>
            )}
          </div>
        }
      />
    </WorkspaceShell>
  );
}
