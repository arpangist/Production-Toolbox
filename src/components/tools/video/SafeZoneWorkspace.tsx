import { useState } from "react";
import { useFileImport } from "../../../hooks/useFileImport";
import { useVideoFile } from "../../../hooks/useVideoFile";
import { WorkspaceShell } from "../../workspace/WorkspaceShell";
import { VideoToolLayout } from "./VideoToolLayout";
import { VideoScrubber } from "./VideoScrubber";
import { seekTo } from "../../../lib/video";
import { downloadBlob } from "../../../lib/downloadFile";
import { SAFE_ZONE_PRESETS } from "../../../lib/safeZonePresets";
import type { ToolDefinition } from "../../../types/tool";
import videoStyles from "./VideoTool.module.css";
import styles from "./SafeZoneWorkspace.module.css";

export default function SafeZoneWorkspace({ tool }: { tool: ToolDefinition }) {
  const { files, error, importFiles, reset } = useFileImport({ acceptedTypes: ["video/*"], multiple: false });
  const file = files[0] ?? null;
  const { videoRef, url, meta, error: videoError, currentTime, setCurrentTime } = useVideoFile(file);

  const [presetIndex, setPresetIndex] = useState(0);
  const [exportError, setExportError] = useState<string | null>(null);
  const preset = SAFE_ZONE_PRESETS[presetIndex];

  const handleSeek = async (time: number) => {
    if (!videoRef.current) return;
    await seekTo(videoRef.current, time);
    setCurrentTime(time);
  };

  const handleExportFrame = () => {
    const video = videoRef.current;
    if (!video || !meta) return;
    setExportError(null);

    const canvas = document.createElement("canvas");
    canvas.width = meta.width;
    canvas.height = meta.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setExportError("2D canvas context is not available.");
      return;
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    for (const guide of preset.guides) {
      const x = (guide.left / 100) * canvas.width;
      const y = (guide.top / 100) * canvas.height;
      const w = canvas.width - x - (guide.right / 100) * canvas.width;
      const h = canvas.height - y - (guide.bottom / 100) * canvas.height;

      ctx.strokeStyle = guide.color;
      ctx.lineWidth = Math.max(2, canvas.width * 0.003);
      ctx.setLineDash([canvas.width * 0.01, canvas.width * 0.006]);
      ctx.strokeRect(x, y, w, h);

      ctx.font = `${Math.round(canvas.width * 0.018)}px sans-serif`;
      const textWidth = ctx.measureText(guide.label).width;
      ctx.fillStyle = guide.color;
      ctx.fillRect(x, y - canvas.width * 0.026, textWidth + 12, canvas.width * 0.026);
      ctx.fillStyle = "#111111";
      ctx.fillText(guide.label, x + 6, y - canvas.width * 0.007);
    }

    canvas.toBlob((blob) => {
      if (blob) downloadBlob(blob, "safe-zone-frame.png");
      else setExportError("Couldn't export this frame.");
    }, "image/png");
  };

  const handleChangeFile = () => reset();

  return (
    <WorkspaceShell title={tool.name}>
      <VideoToolLayout
        file={file}
        error={error}
        onFiles={importFiles}
        onChangeFile={handleChangeFile}
        settings={
          <>
            <div className={videoStyles.field}>
              <span className={videoStyles.fieldLabel}>Safe zone preset</span>
              <div className={videoStyles.chipRow}>
                {SAFE_ZONE_PRESETS.map((option, index) => (
                  <button
                    key={option.name}
                    className={videoStyles.chip}
                    data-active={presetIndex === index}
                    onClick={() => setPresetIndex(index)}
                  >
                    {option.name}
                  </button>
                ))}
              </div>
            </div>
            <button className={videoStyles.primaryButton} onClick={handleExportFrame} disabled={!meta}>
              Export current frame
            </button>
            {exportError && (
              <span className={videoStyles.errorText} role="alert">
                {exportError}
              </span>
            )}
          </>
        }
        preview={
          <div>
            <div className={styles.overlayWrap}>
              <div className={videoStyles.stage}>
                {url && <video ref={videoRef} src={url} className={videoStyles.video} muted playsInline />}
              </div>
              {meta && (
                <div className={styles.overlay}>
                  {preset.guides.map((guide) => (
                    <div
                      key={guide.label}
                      className={styles.guideBox}
                      style={{
                        top: `${guide.top}%`,
                        right: `${guide.right}%`,
                        bottom: `${guide.bottom}%`,
                        left: `${guide.left}%`,
                        // @ts-expect-error custom property
                        "--guide-color": guide.color,
                      }}
                    >
                      <span className={styles.guideLabel} style={{ background: guide.color }}>
                        {guide.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {videoError && (
              <p className={videoStyles.errorText} role="alert">
                {videoError}
              </p>
            )}
            {meta && <VideoScrubber duration={meta.duration} currentTime={currentTime} onSeek={handleSeek} />}
          </div>
        }
        footer={<span className={videoStyles.statusRow}>Guides are a visual reference — export burns them into a still frame.</span>}
      />
    </WorkspaceShell>
  );
}
