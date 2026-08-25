import { useState } from "react";
import { useFileImport } from "../../../hooks/useFileImport";
import { useVideoFile } from "../../../hooks/useVideoFile";
import { WorkspaceShell } from "../../workspace/WorkspaceShell";
import { VideoToolLayout } from "./VideoToolLayout";
import { seekTo, formatTimestamp } from "../../../lib/video";
import { downloadBlob } from "../../../lib/downloadFile";
import { useObjectUrl } from "../../../hooks/useObjectUrl";
import type { ToolDefinition } from "../../../types/tool";
import styles from "./VideoTool.module.css";

export default function ContactSheetWorkspace({ tool }: { tool: ToolDefinition }) {
  const { files, error, importFiles, reset } = useFileImport({ acceptedTypes: ["video/*"], multiple: false });
  const file = files[0] ?? null;
  const { videoRef, url, meta, error: videoError } = useVideoFile(file);

  const [frameCount, setFrameCount] = useState(9);
  const [columns, setColumns] = useState(3);
  const [showTimestamps, setShowTimestamps] = useState(true);
  const [thumbWidth, setThumbWidth] = useState(320);

  const [sheetBlob, setSheetBlob] = useState<Blob | null>(null);
  const sheetUrl = useObjectUrl(sheetBlob);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [genError, setGenError] = useState<string | null>(null);

  const generate = async () => {
    const video = videoRef.current;
    if (!video || !meta) return;

    setGenerating(true);
    setGenError(null);
    setProgress(0);

    try {
      const thumbHeight = Math.round(thumbWidth * (meta.height / meta.width));
      const rows = Math.ceil(frameCount / columns);
      const gap = 4;
      const labelHeight = showTimestamps ? 22 : 0;
      const cellW = thumbWidth + gap;
      const cellH = thumbHeight + labelHeight + gap;

      const sheet = document.createElement("canvas");
      sheet.width = cellW * columns - gap;
      sheet.height = cellH * rows - gap;
      const ctx = sheet.getContext("2d");
      if (!ctx) throw new Error("2D canvas context is not available.");
      ctx.fillStyle = "#111111";
      ctx.fillRect(0, 0, sheet.width, sheet.height);

      for (let i = 0; i < frameCount; i++) {
        const time = ((i + 0.5) / frameCount) * meta.duration;
        await seekTo(video, time);

        const col = i % columns;
        const row = Math.floor(i / columns);
        const x = col * cellW;
        const y = row * cellH;

        ctx.drawImage(video, x, y, thumbWidth, thumbHeight);

        if (showTimestamps) {
          const label = formatTimestamp(time);
          ctx.font = "12px monospace";
          const textWidth = ctx.measureText(label).width;
          ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
          ctx.fillRect(x + 4, y + thumbHeight + 2, textWidth + 8, 16);
          ctx.fillStyle = "#ffffff";
          ctx.fillText(label, x + 8, y + thumbHeight + 14);
        }

        setProgress((i + 1) / frameCount);
      }

      const blob = await new Promise<Blob>((resolve, reject) => {
        sheet.toBlob((b) => (b ? resolve(b) : reject(new Error("Couldn't generate the contact sheet."))), "image/png");
      });
      setSheetBlob(blob);
    } catch (err) {
      setGenError(err instanceof Error ? err.message : "Couldn't generate the contact sheet.");
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (sheetBlob) downloadBlob(sheetBlob, "contact-sheet.png");
  };

  const handleChangeFile = () => {
    reset();
    setSheetBlob(null);
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
              <span className={styles.fieldLabel}>Frames — {frameCount}</span>
              <input
                className={styles.slider}
                type="range"
                min={4}
                max={24}
                value={frameCount}
                onChange={(e) => setFrameCount(Number(e.target.value))}
                aria-label="Number of frames"
              />
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Columns — {columns}</span>
              <input
                className={styles.slider}
                type="range"
                min={2}
                max={6}
                value={columns}
                onChange={(e) => setColumns(Number(e.target.value))}
                aria-label="Columns"
              />
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Thumbnail width — {thumbWidth}px</span>
              <input
                className={styles.slider}
                type="range"
                min={120}
                max={480}
                step={20}
                value={thumbWidth}
                onChange={(e) => setThumbWidth(Number(e.target.value))}
                aria-label="Thumbnail width"
              />
            </div>
            <label className={styles.checkboxRow}>
              <input type="checkbox" checked={showTimestamps} onChange={(e) => setShowTimestamps(e.target.checked)} />
              Timestamp labels
            </label>
            <button className={styles.primaryButton} onClick={generate} disabled={!meta || generating}>
              {generating ? `Generating… ${Math.round(progress * 100)}%` : "Generate contact sheet"}
            </button>
            {genError && (
              <span className={styles.errorText} role="alert">
                {genError}
              </span>
            )}
          </>
        }
        preview={
          <div className={styles.stage}>
            {sheetUrl ? (
              <img src={sheetUrl} alt="Contact sheet" style={{ maxWidth: "100%", display: "block" }} />
            ) : url ? (
              <video ref={videoRef} src={url} className={styles.video} muted playsInline />
            ) : null}
            {videoError && (
              <p className={styles.errorText} role="alert">
                {videoError}
              </p>
            )}
          </div>
        }
        footer={
          <div className={styles.footer}>
            <span className={styles.statusRow}>{sheetBlob ? "Contact sheet ready" : "Generate a sheet to preview it here"}</span>
            <button className={styles.primaryButton} disabled={!sheetBlob} onClick={handleDownload}>
              Download PNG
            </button>
          </div>
        }
      />
    </WorkspaceShell>
  );
}
