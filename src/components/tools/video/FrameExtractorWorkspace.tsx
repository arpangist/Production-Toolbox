import { useRef, useState } from "react";
import { useFileImport } from "../../../hooks/useFileImport";
import { useVideoFile } from "../../../hooks/useVideoFile";
import { WorkspaceShell } from "../../workspace/WorkspaceShell";
import { VideoToolLayout } from "./VideoToolLayout";
import { VideoScrubber } from "./VideoScrubber";
import { captureFrame, seekTo } from "../../../lib/video";
import { downloadAsZip } from "../../../lib/zipExport";
import { formatBytes } from "../../../lib/format";
import { FORMAT_LABELS, supportsQuality, withExtension } from "../../../lib/imageFormat";
import type { ImageFormat } from "../../../workers/imageProcessing.types";
import type { ToolDefinition } from "../../../types/tool";
import styles from "./VideoTool.module.css";

interface Capture {
  id: string;
  url: string;
  blob: Blob;
  time: number;
}

export default function FrameExtractorWorkspace({ tool }: { tool: ToolDefinition }) {
  const { files, error, importFiles, reset } = useFileImport({ acceptedTypes: ["video/*"], multiple: false });
  const file = files[0] ?? null;
  const { videoRef, url, meta, error: videoError, currentTime, setCurrentTime } = useVideoFile(file);

  const [format, setFormat] = useState<ImageFormat>("image/jpeg");
  const [quality, setQuality] = useState(90);
  const [captures, setCaptures] = useState<Capture[]>([]);
  const [capturing, setCapturing] = useState(false);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const captureIdRef = useRef(0);

  const handleSeek = async (time: number) => {
    if (!videoRef.current) return;
    await seekTo(videoRef.current, time);
    setCurrentTime(time);
  };

  const handleCapture = async () => {
    if (!videoRef.current) return;
    setCapturing(true);
    setCaptureError(null);
    try {
      const blob = await captureFrame(videoRef.current, format, quality / 100);
      const id = `frame-${++captureIdRef.current}`;
      setCaptures((prev) => [...prev, { id, blob, url: URL.createObjectURL(blob), time: currentTime }]);
    } catch (err) {
      setCaptureError(err instanceof Error ? err.message : "Couldn't capture this frame.");
    } finally {
      setCapturing(false);
    }
  };

  const removeCapture = (id: string) => {
    setCaptures((prev) => {
      const target = prev.find((c) => c.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((c) => c.id !== id);
    });
  };

  const handleDownloadAll = async () => {
    if (captures.length === 0) return;
    const entries = await Promise.all(
      captures.map(async (capture, index) => ({
        name: withExtension(`frame-${index + 1}`, format),
        data: new Uint8Array(await capture.blob.arrayBuffer()),
      })),
    );
    await downloadAsZip(entries, "frames.zip");
  };

  const handleChangeFile = () => {
    reset();
    setCaptures((prev) => {
      for (const c of prev) URL.revokeObjectURL(c.url);
      return [];
    });
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
              <span className={styles.fieldLabel}>Format</span>
              <select className={styles.select} value={format} onChange={(e) => setFormat(e.target.value as ImageFormat)}>
                {(["image/jpeg", "image/png", "image/webp"] as ImageFormat[]).map((f) => (
                  <option key={f} value={f}>
                    {FORMAT_LABELS[f]}
                  </option>
                ))}
              </select>
            </div>

            {supportsQuality(format) && (
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

            <button className={styles.primaryButton} onClick={handleCapture} disabled={!meta || capturing}>
              {capturing ? "Capturing…" : "Capture frame"}
            </button>
            {captureError && (
              <span className={styles.errorText} role="alert">
                {captureError}
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
          </div>
        }
        footer={
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", width: "100%" }}>
            {captures.length > 0 && (
              <div className={styles.thumbStrip}>
                {captures.map((capture) => (
                  <div className={styles.thumb} key={capture.id}>
                    <img className={styles.thumbImage} src={capture.url} alt={`Frame at ${capture.time.toFixed(1)}s`} />
                    <button className={styles.thumbRemove} onClick={() => removeCapture(capture.id)} aria-label="Remove frame">
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className={styles.footer}>
              <span className={styles.statusRow}>
                {captures.length} frame{captures.length === 1 ? "" : "s"} captured
                {captures.length > 0 && ` · ${formatBytes(captures.reduce((sum, c) => sum + c.blob.size, 0))}`}
              </span>
              <button className={styles.primaryButton} disabled={captures.length === 0} onClick={handleDownloadAll}>
                Download all as ZIP
              </button>
            </div>
          </div>
        }
      />
    </WorkspaceShell>
  );
}
