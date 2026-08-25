import { useEffect, useRef, useState } from "react";
import { useFileImport } from "../../../hooks/useFileImport";
import { useVideoFile } from "../../../hooks/useVideoFile";
import { useObjectUrl } from "../../../hooks/useObjectUrl";
import { WorkspaceShell } from "../../workspace/WorkspaceShell";
import { VideoToolLayout } from "./VideoToolLayout";
import { VideoScrubber } from "./VideoScrubber";
import { seekTo, formatTimestamp } from "../../../lib/video";
import { trimVideo } from "../../../lib/videoTrim";
import { downloadBlob } from "../../../lib/downloadFile";
import { formatBytes } from "../../../lib/format";
import type { ToolDefinition } from "../../../types/tool";
import styles from "./VideoTool.module.css";

export default function TrimWorkspace({ tool }: { tool: ToolDefinition }) {
  const { files, error, importFiles, reset } = useFileImport({ acceptedTypes: ["video/*"], multiple: false });
  const file = files[0] ?? null;
  const { videoRef, url, meta, error: videoError, currentTime, setCurrentTime } = useVideoFile(file);

  const [inPoint, setInPoint] = useState(0);
  const [outPoint, setOutPoint] = useState(0);
  const [previewing, setPreviewing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportError, setExportError] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const resultUrl = useObjectUrl(resultBlob);
  const cancelledRef = useRef(false);

  // Default the out point to the clip's full duration once metadata loads,
  // without an effect — this is state derived from a value change.
  const [outPointSourceMeta, setOutPointSourceMeta] = useState(meta);
  if (meta !== outPointSourceMeta) {
    setOutPointSourceMeta(meta);
    if (meta) setOutPoint(meta.duration);
  }

  useEffect(() => {
    if (previewing && currentTime >= outPoint) {
      videoRef.current?.pause();
      setPreviewing(false);
    }
  }, [previewing, currentTime, outPoint, videoRef]);

  const handleSeek = async (time: number) => {
    if (!videoRef.current) return;
    await seekTo(videoRef.current, time);
    setCurrentTime(time);
  };

  const handlePreview = async () => {
    if (!videoRef.current) return;
    await seekTo(videoRef.current, inPoint);
    setPreviewing(true);
    await videoRef.current.play();
  };

  const handleExport = async () => {
    if (!videoRef.current || outPoint <= inPoint) return;
    setExporting(true);
    setExportError(null);
    setExportProgress(0);
    cancelledRef.current = false;

    try {
      const blob = await trimVideo(videoRef.current, inPoint, outPoint, ({ currentTime: t, inPoint: ip, outPoint: op }) => {
        setExportProgress(Math.min(1, (t - ip) / (op - ip)));
      });
      if (!cancelledRef.current) setResultBlob(blob);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : "Couldn't export this clip. Try MP4 (H.264) or WebM source video.");
    } finally {
      setExporting(false);
    }
  };

  const handleDownload = () => {
    if (resultBlob) downloadBlob(resultBlob, "trimmed-clip.webm");
  };

  const handleChangeFile = () => {
    reset();
    setResultBlob(null);
    setInPoint(0);
    setOutPoint(0);
  };

  const trimDuration = Math.max(0, outPoint - inPoint);

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
              <span className={styles.fieldLabel}>In point — {formatTimestamp(inPoint)}</span>
              <div className={styles.row}>
                <input
                  className={styles.slider}
                  type="range"
                  min={0}
                  max={meta?.duration ?? 0}
                  step={0.01}
                  value={inPoint}
                  onChange={(e) => setInPoint(Math.min(Number(e.target.value), outPoint))}
                  aria-label="In point"
                />
                <button className={styles.secondaryButton} onClick={() => setInPoint(currentTime)}>
                  Set
                </button>
              </div>
            </div>

            <div className={styles.field}>
              <span className={styles.fieldLabel}>Out point — {formatTimestamp(outPoint)}</span>
              <div className={styles.row}>
                <input
                  className={styles.slider}
                  type="range"
                  min={0}
                  max={meta?.duration ?? 0}
                  step={0.01}
                  value={outPoint}
                  onChange={(e) => setOutPoint(Math.max(Number(e.target.value), inPoint))}
                  aria-label="Out point"
                />
                <button className={styles.secondaryButton} onClick={() => setOutPoint(currentTime)}>
                  Set
                </button>
              </div>
            </div>

            <span className={styles.statusRow}>Clip length: {formatTimestamp(trimDuration)}</span>

            <button className={styles.secondaryButton} onClick={handlePreview} disabled={!meta || previewing || exporting}>
              {previewing ? "Previewing…" : "Preview trim"}
            </button>

            <button className={styles.primaryButton} onClick={handleExport} disabled={!meta || exporting || trimDuration <= 0}>
              {exporting ? `Exporting… ${Math.round(exportProgress * 100)}%` : "Export trimmed clip"}
            </button>
            {exportError && (
              <span className={styles.errorText} role="alert">
                {exportError}
              </span>
            )}
          </>
        }
        preview={
          <div>
            <div className={styles.stage}>
              {url && <video ref={videoRef} src={url} className={styles.video} muted playsInline />}
            </div>
            {videoError && (
              <p className={styles.errorText} role="alert">
                {videoError}
              </p>
            )}
            {meta && <VideoScrubber duration={meta.duration} currentTime={currentTime} onSeek={handleSeek} />}
            {resultUrl && (
              <div style={{ marginTop: "var(--space-4)" }}>
                <span className={styles.fieldLabel}>Trimmed result</span>
                <div className={styles.stage} style={{ marginTop: "var(--space-2)" }}>
                  <video src={resultUrl} className={styles.video} controls playsInline />
                </div>
              </div>
            )}
          </div>
        }
        footer={
          <div className={styles.footer}>
            <span className={styles.statusRow}>
              {resultBlob ? `Trimmed clip ready · ${formatBytes(resultBlob.size)}` : "Export to produce a downloadable clip"}
            </span>
            <button className={styles.primaryButton} disabled={!resultBlob} onClick={handleDownload}>
              Download WebM
            </button>
          </div>
        }
      />
    </WorkspaceShell>
  );
}
