import { useMemo, useState } from "react";
import { useFileImport } from "../../../hooks/useFileImport";
import { useVideoFile } from "../../../hooks/useVideoFile";
import { detectCuts, type Shot } from "../../../lib/cutDetection";
import { formatTimestamp } from "../../../lib/video";
import { WorkspaceShell } from "../../workspace/WorkspaceShell";
import { VideoToolLayout } from "./VideoToolLayout";
import type { ToolDefinition } from "../../../types/tool";
import styles from "./VideoTool.module.css";

const BUCKETS = [0.5, 1, 2, 3, 5, 8, Infinity];

function bucketLabel(index: number): string {
  return BUCKETS[index] === Infinity ? `${BUCKETS[index - 1]}s+` : `<${BUCKETS[index]}s`;
}

function bucketShots(shots: Shot[]): number[] {
  const counts = new Array(BUCKETS.length).fill(0);
  for (const shot of shots) {
    const duration = shot.end - shot.start;
    const index = BUCKETS.findIndex((max) => duration < max);
    counts[index === -1 ? BUCKETS.length - 1 : index]++;
  }
  return counts;
}

export default function ShotAnalyzerWorkspace({ tool }: { tool: ToolDefinition }) {
  const { files, error, importFiles, reset } = useFileImport({ acceptedTypes: ["video/*"], multiple: false });
  const file = files[0] ?? null;
  const { videoRef, url, meta, error: videoError } = useVideoFile(file);

  const [sensitivity, setSensitivity] = useState(30);
  const [shots, setShots] = useState<Shot[] | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  const runAnalysis = async () => {
    const video = videoRef.current;
    if (!video || !meta) return;
    setAnalyzing(true);
    setAnalyzeError(null);
    setProgress(0);
    try {
      const result = await detectCuts(video, meta.duration, { sampleInterval: 0.5, threshold: sensitivity }, setProgress);
      setShots(result.shots);
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : "Couldn't analyze this video.");
    } finally {
      setAnalyzing(false);
    }
  };

  const stats = useMemo(() => {
    if (!shots || shots.length === 0) return null;
    const durations = shots.map((s) => s.end - s.start);
    const total = durations.reduce((a, b) => a + b, 0);
    return {
      count: shots.length,
      average: total / shots.length,
      shortest: Math.min(...durations),
      longest: Math.max(...durations),
      buckets: bucketShots(shots),
    };
  }, [shots]);

  const maxBucket = stats ? Math.max(...stats.buckets, 1) : 1;

  const handleChangeFile = () => {
    reset();
    setShots(null);
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
            </div>
            <button className={styles.primaryButton} onClick={runAnalysis} disabled={!meta || analyzing}>
              {analyzing ? `Analyzing… ${Math.round(progress * 100)}%` : "Analyze shots"}
            </button>
            {analyzeError && <span className={styles.errorText}>{analyzeError}</span>}
          </>
        }
        preview={
          <div>
            <div className={styles.stage}>{url && <video ref={videoRef} src={url} className={styles.video} muted playsInline />}</div>
            {videoError && <p className={styles.errorText}>{videoError}</p>}
          </div>
        }
        footer={
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", width: "100%" }}>
            {stats ? (
              <>
                <div style={{ display: "flex", gap: "var(--space-5)", fontSize: 13 }}>
                  <span>
                    Total shots <strong className="mono">{stats.count}</strong>
                  </span>
                  <span>
                    Average <strong className="mono">{formatTimestamp(stats.average)}</strong>
                  </span>
                  <span>
                    Shortest <strong className="mono">{formatTimestamp(stats.shortest)}</strong>
                  </span>
                  <span>
                    Longest <strong className="mono">{formatTimestamp(stats.longest)}</strong>
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {stats.buckets.map((count, index) => (
                    <div key={index} style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                      <span className="mono" style={{ fontSize: 11, width: 48, color: "var(--color-text-secondary)" }}>
                        {bucketLabel(index)}
                      </span>
                      <div style={{ flex: 1, background: "var(--color-border)", borderRadius: 3, height: 14 }}>
                        <div
                          style={{
                            width: `${(count / maxBucket) * 100}%`,
                            background: "var(--color-accent)",
                            height: "100%",
                            borderRadius: 3,
                          }}
                        />
                      </div>
                      <span className="mono" style={{ fontSize: 11, width: 20, textAlign: "right" }}>
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <span className={styles.statusRow}>Run analysis to see shot statistics.</span>
            )}
          </div>
        }
      />
    </WorkspaceShell>
  );
}
