import { useRef, useState } from "react";
import { useFileImport } from "../../../hooks/useFileImport";
import { loadVideoElement } from "../../../lib/video";
import { transformVideo } from "../../../lib/videoBatchTransform";
import { downloadAsZip } from "../../../lib/zipExport";
import { downloadBlob } from "../../../lib/downloadFile";
import { formatBytes } from "../../../lib/format";
import { MultiFileStage } from "../assets/MultiFileStage";
import { WorkspaceShell } from "../../workspace/WorkspaceShell";
import type { ToolDefinition } from "../../../types/tool";
import imageStyles from "../image/ImageTool.module.css";
import assetStyles from "../assets/MultiFile.module.css";

type QueueStatus = "waiting" | "processing" | "done" | "error";

interface QueueItem {
  file: File;
  status: QueueStatus;
  progress: number;
  blob: Blob | null;
  error: string | null;
}

const RATIO_PRESETS = [
  { label: "9:16 (1080×1920)", width: 1080, height: 1920 },
  { label: "1:1 (1080×1080)", width: 1080, height: 1080 },
  { label: "16:9 (1920×1080)", width: 1920, height: 1080 },
  { label: "4:5 (1080×1350)", width: 1080, height: 1350 },
];

export default function BatchVideoProcessorWorkspace({ tool }: { tool: ToolDefinition }) {
  const { files, error, importFiles, reset } = useFileImport({ acceptedTypes: ["video/*"], multiple: true });
  const [width, setWidth] = useState(1080);
  const [height, setHeight] = useState(1920);
  const [cropToFit, setCropToFit] = useState(true);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [running, setRunning] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const startBatch = async () => {
    if (files.length === 0 || !videoRef.current) return;
    setRunning(true);
    const items: QueueItem[] = files.map((file) => ({ file, status: "waiting", progress: 0, blob: null, error: null }));
    setQueue(items);

    const video = videoRef.current;
    for (let i = 0; i < files.length; i++) {
      setQueue((prev) => prev.map((item, idx) => (idx === i ? { ...item, status: "processing" } : item)));
      const url = URL.createObjectURL(files[i]);
      try {
        await loadVideoElement(video, url);
        const blob = await transformVideo(video, { targetWidth: width, targetHeight: height, cropToFit }, (progress) => {
          setQueue((prev) => prev.map((item, idx) => (idx === i ? { ...item, progress } : item)));
        });
        setQueue((prev) => prev.map((item, idx) => (idx === i ? { ...item, status: "done", blob, progress: 1 } : item)));
      } catch (err) {
        setQueue((prev) =>
          prev.map((item, idx) => (idx === i ? { ...item, status: "error", error: err instanceof Error ? err.message : "Failed" } : item)),
        );
      } finally {
        URL.revokeObjectURL(url);
      }
    }
    setRunning(false);
  };

  const handleDownloadAll = async () => {
    const done = queue.filter((item) => item.blob);
    if (done.length === 0) return;
    const entries = await Promise.all(
      done.map(async (item, i) => ({
        name: `${item.file.name.replace(/\.[^./]+$/, "")}-${i + 1}.webm`,
        data: new Uint8Array(await item.blob!.arrayBuffer()),
      })),
    );
    await downloadAsZip(entries, "batch-videos.zip");
  };

  const handleClear = () => {
    reset();
    setQueue([]);
  };

  const doneCount = queue.filter((i) => i.status === "done").length;

  return (
    <WorkspaceShell title={tool.name}>
      <video ref={videoRef} muted playsInline style={{ display: "none" }} />
      <MultiFileStage files={files} error={error} accept="video/*" dropLabel="Import videos to process" onFiles={importFiles} onClear={handleClear}>
        <div className={imageStyles.row} style={{ flexWrap: "wrap", gap: "var(--space-4)", marginBottom: "var(--space-4)" }}>
          <div className={imageStyles.field}>
            <span className={imageStyles.fieldLabel}>Presets</span>
            <div className={assetStyles.chipRow}>
              {RATIO_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  className={assetStyles.chip}
                  data-active={width === preset.width && height === preset.height}
                  onClick={() => {
                    setWidth(preset.width);
                    setHeight(preset.height);
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className={imageStyles.row} style={{ flexWrap: "wrap", gap: "var(--space-3)", marginBottom: "var(--space-4)" }}>
          <input className={imageStyles.input} type="number" value={width} onChange={(e) => setWidth(Number(e.target.value))} style={{ width: 100 }} aria-label="Width" />
          <span aria-hidden="true">×</span>
          <input className={imageStyles.input} type="number" value={height} onChange={(e) => setHeight(Number(e.target.value))} style={{ width: 100 }} aria-label="Height" />
          <label className={imageStyles.checkboxRow}>
            <input type="checkbox" checked={cropToFit} onChange={(e) => setCropToFit(e.target.checked)} />
            Crop to fill (uncheck to letterbox)
          </label>
        </div>

        <button className={assetStyles.primaryButton} onClick={startBatch} disabled={files.length === 0 || running} style={{ marginBottom: "var(--space-4)" }}>
          {running ? "Processing…" : `Process ${files.length} video${files.length === 1 ? "" : "s"}`}
        </button>

        {queue.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            {queue.map((item, i) => (
              <div key={i} className={assetStyles.card} style={{ padding: "var(--space-3)", display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                <span className="mono" style={{ width: 24 }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span style={{ flex: 1 }}>{item.file.name}</span>
                {item.status === "processing" && <span className={imageStyles.statusRow}>Processing… {Math.round(item.progress * 100)}%</span>}
                {item.status === "waiting" && <span className={imageStyles.statusRow}>Waiting</span>}
                {item.status === "done" && item.blob && (
                  <>
                    <span className={imageStyles.statusRow}>{formatBytes(item.blob.size)}</span>
                    <button className={assetStyles.secondaryButton} onClick={() => downloadBlob(item.blob!, `${item.file.name.replace(/\.[^./]+$/, "")}.webm`)}>
                      Download
                    </button>
                  </>
                )}
                {item.status === "error" && <span className={assetStyles.errorText}>{item.error}</span>}
              </div>
            ))}
          </div>
        )}

        <div className={assetStyles.footer}>
          <span className={assetStyles.statusRow}>{queue.length > 0 ? `${doneCount} / ${queue.length} done` : ""}</span>
          <button className={assetStyles.primaryButton} disabled={doneCount === 0} onClick={handleDownloadAll}>
            Download all as ZIP
          </button>
        </div>
      </MultiFileStage>
    </WorkspaceShell>
  );
}
