import { useEffect, useState } from "react";
import { useFileImport } from "../../../hooks/useFileImport";
import { useObjectUrls } from "../../../hooks/useObjectUrls";
import { buildSequenceVideo } from "../../../lib/imageSequenceVideo";
import { downloadAsZip } from "../../../lib/zipExport";
import { downloadBlob } from "../../../lib/downloadFile";
import { MultiFileStage } from "../assets/MultiFileStage";
import { WorkspaceShell } from "../../workspace/WorkspaceShell";
import type { ToolDefinition } from "../../../types/tool";
import imageStyles from "../image/ImageTool.module.css";
import assetStyles from "../assets/MultiFile.module.css";

export default function ImageSequenceBuilderWorkspace({ tool }: { tool: ToolDefinition }) {
  const { files, error, importFiles, reset, removeFile } = useFileImport({ acceptedTypes: ["image/*"], multiple: true });
  const fileUrls = useObjectUrls(files);
  const [order, setOrder] = useState<number[]>([]);
  const [fps, setFps] = useState(12);
  const [playing, setPlaying] = useState(false);
  const [playIndex, setPlayIndex] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [exportError, setExportError] = useState<string | null>(null);

  const indices = order.length === files.length ? order : files.map((_, i) => i);

  useEffect(() => {
    if (!playing || indices.length === 0) return;
    const interval = setInterval(() => setPlayIndex((i) => (i + 1) % indices.length), 1000 / fps);
    return () => clearInterval(interval);
  }, [playing, fps, indices.length]);

  const move = (position: number, direction: -1 | 1) => {
    const target = position + direction;
    if (target < 0 || target >= indices.length) return;
    const next = [...indices];
    [next[position], next[target]] = [next[target], next[position]];
    setOrder(next);
  };

  const orderedFiles = indices.map((i) => files[i]).filter((f): f is File => !!f);

  const handleDownloadZip = async () => {
    const entries = await Promise.all(
      orderedFiles.map(async (file, i) => ({
        name: `frame${String(i + 1).padStart(4, "0")}.${file.name.split(".").pop() || "png"}`,
        data: new Uint8Array(await file.arrayBuffer()),
      })),
    );
    await downloadAsZip(entries, "image-sequence.zip");
  };

  const handleExportVideo = async () => {
    if (orderedFiles.length === 0) return;
    setExporting(true);
    setExportError(null);
    setProgress(0);
    try {
      const blob = await buildSequenceVideo(orderedFiles, fps, setProgress);
      downloadBlob(blob, "image-sequence.webm");
    } catch (err) {
      setExportError(err instanceof Error ? err.message : "Couldn't build the video.");
    } finally {
      setExporting(false);
    }
  };

  const handleClear = () => {
    reset();
    setOrder([]);
    setPlaying(false);
  };

  const currentFrame = orderedFiles[playIndex % Math.max(1, orderedFiles.length)];

  return (
    <WorkspaceShell title={tool.name}>
      <MultiFileStage files={files} error={error} accept="image/*" dropLabel="Import sequence frames" onFiles={importFiles} onClear={handleClear}>
        <div className={imageStyles.field} style={{ marginBottom: "var(--space-4)" }}>
          <span className={imageStyles.fieldLabel}>FPS — {fps}</span>
          <input className={imageStyles.slider} type="range" min={1} max={30} value={fps} onChange={(e) => setFps(Number(e.target.value))} />
        </div>

        {currentFrame && (
          <div className={imageStyles.previewArea} style={{ marginBottom: "var(--space-4)", minHeight: 240 }}>
            <img className={imageStyles.previewImage} src={fileUrls.get(currentFrame)} alt={`Frame ${playIndex + 1}`} />
          </div>
        )}
        <div className={assetStyles.chipRow} style={{ marginBottom: "var(--space-4)" }}>
          <button className={assetStyles.secondaryButton} onClick={() => setPlaying((p) => !p)} disabled={orderedFiles.length === 0}>
            {playing ? "Pause" : "Play preview"}
          </button>
          <span className={imageStyles.statusRow}>
            Frame {orderedFiles.length > 0 ? (playIndex % orderedFiles.length) + 1 : 0} / {orderedFiles.length}
          </span>
        </div>

        <div className={assetStyles.grid}>
          {indices.map((fileIndex, position) => {
            const file = files[fileIndex];
            if (!file) return null;
            return (
              <div className={assetStyles.card} key={file.name + fileIndex}>
                <img className={assetStyles.cardThumb} src={fileUrls.get(file)} alt={file.name} />
                <div className={assetStyles.cardInfo}>
                  <span className={assetStyles.cardName}>
                    {position + 1}. {file.name}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "0 var(--space-2) var(--space-2)" }}>
                  <button className={assetStyles.secondaryButton} onClick={() => move(position, -1)} disabled={position === 0}>
                    ↑
                  </button>
                  <button className={assetStyles.secondaryButton} onClick={() => removeFile(fileIndex)}>
                    Remove
                  </button>
                  <button className={assetStyles.secondaryButton} onClick={() => move(position, 1)} disabled={position === indices.length - 1}>
                    ↓
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {exportError && <p className={assetStyles.errorText}>{exportError}</p>}

        <div className={assetStyles.footer}>
          <span className={assetStyles.statusRow}>{exporting ? `Exporting… ${Math.round(progress * 100)}%` : `${orderedFiles.length} frames`}</span>
          <div className={imageStyles.row}>
            <button className={assetStyles.secondaryButton} disabled={orderedFiles.length === 0} onClick={handleDownloadZip}>
              Download ZIP
            </button>
            <button className={assetStyles.primaryButton} disabled={orderedFiles.length === 0 || exporting} onClick={handleExportVideo}>
              Export as video (WebM)
            </button>
          </div>
        </div>
      </MultiFileStage>
    </WorkspaceShell>
  );
}
