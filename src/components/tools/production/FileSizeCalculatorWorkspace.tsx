import { useState } from "react";
import { estimateImageBytes, estimateVideoBytes, type EstimateImageFormat } from "../../../lib/sizeEstimate";
import { formatBytes } from "../../../lib/format";
import { WorkspaceShell } from "../../workspace/WorkspaceShell";
import type { ToolDefinition } from "../../../types/tool";
import imageStyles from "../image/ImageTool.module.css";
import assetStyles from "../assets/MultiFile.module.css";

export default function FileSizeCalculatorWorkspace({ tool }: { tool: ToolDefinition }) {
  const [imgWidth, setImgWidth] = useState(1920);
  const [imgHeight, setImgHeight] = useState(1080);
  const [imgFormat, setImgFormat] = useState<EstimateImageFormat>("jpeg");
  const [imgQuality, setImgQuality] = useState(85);

  const [duration, setDuration] = useState(30);
  const [videoBitrate, setVideoBitrate] = useState(8000);
  const [audioBitrate, setAudioBitrate] = useState(128);

  const imageEstimate = estimateImageBytes(imgWidth, imgHeight, imgFormat, imgQuality);
  const videoEstimate = estimateVideoBytes(duration, videoBitrate, audioBitrate);

  return (
    <WorkspaceShell title={tool.name}>
      <div className={imageStyles.layout}>
        <div className={assetStyles.group}>
          <span className={assetStyles.groupTitle}>Image estimate</span>
          <div className={imageStyles.row} style={{ flexWrap: "wrap", gap: "var(--space-3)" }}>
            <input className={imageStyles.input} type="number" value={imgWidth} onChange={(e) => setImgWidth(Number(e.target.value))} style={{ width: 100 }} aria-label="Width" />
            <span aria-hidden="true">×</span>
            <input className={imageStyles.input} type="number" value={imgHeight} onChange={(e) => setImgHeight(Number(e.target.value))} style={{ width: 100 }} aria-label="Height" />
            <select className={imageStyles.select} value={imgFormat} onChange={(e) => setImgFormat(e.target.value as EstimateImageFormat)} style={{ width: 120 }}>
              <option value="jpeg">JPEG</option>
              <option value="png">PNG</option>
              <option value="webp">WebP</option>
            </select>
          </div>
          {imgFormat !== "png" && (
            <div className={imageStyles.field}>
              <span className={imageStyles.fieldLabel}>Quality — {imgQuality}%</span>
              <input className={imageStyles.slider} type="range" min={1} max={100} value={imgQuality} onChange={(e) => setImgQuality(Number(e.target.value))} />
            </div>
          )}
          <div style={{ fontSize: 28, fontWeight: 700, marginTop: "var(--space-2)" }}>~{formatBytes(imageEstimate)}</div>
          <span className={imageStyles.statusRow}>
            Estimate only — actual compressed size depends heavily on image content. Use Compress for a real result.
          </span>
        </div>

        <div className={assetStyles.group}>
          <span className={assetStyles.groupTitle}>Video estimate</span>
          <div className={imageStyles.field}>
            <span className={imageStyles.fieldLabel}>Duration — {duration}s</span>
            <input className={imageStyles.slider} type="range" min={1} max={600} value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
          </div>
          <div className={imageStyles.field}>
            <span className={imageStyles.fieldLabel}>Video bitrate — {videoBitrate} kbps</span>
            <input className={imageStyles.slider} type="range" min={500} max={30000} step={500} value={videoBitrate} onChange={(e) => setVideoBitrate(Number(e.target.value))} />
          </div>
          <div className={imageStyles.field}>
            <span className={imageStyles.fieldLabel}>Audio bitrate — {audioBitrate} kbps</span>
            <input className={imageStyles.slider} type="range" min={0} max={320} step={16} value={audioBitrate} onChange={(e) => setAudioBitrate(Number(e.target.value))} />
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, marginTop: "var(--space-2)" }}>~{formatBytes(videoEstimate)}</div>
          <span className={imageStyles.statusRow}>Estimate based on target bitrate × duration — actual encoder output may vary slightly.</span>
        </div>
      </div>
    </WorkspaceShell>
  );
}
