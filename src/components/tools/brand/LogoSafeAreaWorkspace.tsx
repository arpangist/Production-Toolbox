import { useState } from "react";
import { useFileImport } from "../../../hooks/useFileImport";
import { useImageDimensions } from "../../../hooks/useImageDimensions";
import { useObjectUrl } from "../../../hooks/useObjectUrl";
import { downloadBlob } from "../../../lib/downloadFile";
import { ImageToolLayout } from "../image/ImageToolLayout";
import { WorkspaceShell } from "../../workspace/WorkspaceShell";
import type { ToolDefinition } from "../../../types/tool";
import imageStyles from "../image/ImageTool.module.css";
import styles from "./LogoSafeAreaWorkspace.module.css";

const MAX_PREVIEW_WIDTH = 480;

export default function LogoSafeAreaWorkspace({ tool }: { tool: ToolDefinition }) {
  const { files, error, importFiles, reset } = useFileImport({ acceptedTypes: ["image/*"], multiple: false });
  const file = files[0] ?? null;
  const url = useObjectUrl(file);
  const dimensions = useImageDimensions(file);

  const [clearSpacePercent, setClearSpacePercent] = useState(25);
  const [minWidth, setMinWidth] = useState(120);
  const [minHeight, setMinHeight] = useState(40);

  const scale = dimensions ? Math.min(1, MAX_PREVIEW_WIDTH / dimensions.width) : 1;
  const previewLogoW = dimensions ? dimensions.width * scale : 0;
  const previewLogoH = dimensions ? dimensions.height * scale : 0;
  const clearSpacePx = (clearSpacePercent / 100) * previewLogoW;

  const handleExport = async () => {
    if (!dimensions || !url) return;
    const img = new Image();
    img.src = url;
    await img.decode();

    const clearSpace = (clearSpacePercent / 100) * dimensions.width;
    const labelHeight = 90;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(dimensions.width + clearSpace * 2);
    canvas.height = Math.round(dimensions.height + clearSpace * 2 + labelHeight);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#2f5fff";
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.strokeRect(1, 1, dimensions.width + clearSpace * 2 - 2, dimensions.height + clearSpace * 2 - 2);
    ctx.drawImage(img, clearSpace, clearSpace, dimensions.width, dimensions.height);

    ctx.setLineDash([]);
    ctx.fillStyle = "#111111";
    ctx.font = "14px sans-serif";
    const textY = dimensions.height + clearSpace * 2 + 28;
    ctx.fillText(`Clear space: ${clearSpacePercent}% (${Math.round(clearSpace)}px)`, 12, textY);
    ctx.fillText(`Minimum size: ${minWidth}×${minHeight}px`, 12, textY + 24);

    canvas.toBlob((blob) => {
      if (blob) downloadBlob(blob, "logo-safe-area.png");
    }, "image/png");
  };

  const handleChangeFile = () => reset();

  return (
    <WorkspaceShell title={tool.name}>
      <ImageToolLayout
        file={file}
        error={error}
        onFiles={importFiles}
        onChangeFile={handleChangeFile}
        settings={
          <>
            <div className={imageStyles.field}>
              <span className={imageStyles.fieldLabel}>Clear space — {clearSpacePercent}% of logo width</span>
              <input
                className={imageStyles.slider}
                type="range"
                min={0}
                max={100}
                value={clearSpacePercent}
                onChange={(e) => setClearSpacePercent(Number(e.target.value))}
              />
            </div>
            <div className={imageStyles.field}>
              <span className={imageStyles.fieldLabel}>Minimum width — {minWidth}px</span>
              <input className={imageStyles.slider} type="range" min={20} max={400} value={minWidth} onChange={(e) => setMinWidth(Number(e.target.value))} />
            </div>
            <div className={imageStyles.field}>
              <span className={imageStyles.fieldLabel}>Minimum height — {minHeight}px</span>
              <input
                className={imageStyles.slider}
                type="range"
                min={10}
                max={200}
                value={minHeight}
                onChange={(e) => setMinHeight(Number(e.target.value))}
              />
            </div>
            <button className={imageStyles.downloadButton} onClick={handleExport} disabled={!dimensions}>
              Download diagram (PNG)
            </button>
          </>
        }
        preview={
          <div className={styles.stageWrap}>
            {url && dimensions && (
              <div
                className={styles.stage}
                style={{
                  width: previewLogoW + clearSpacePx * 2,
                  height: previewLogoH + clearSpacePx * 2,
                }}
              >
                <span className={styles.clearSpaceLabel}>
                  Clear space {clearSpacePercent}% ({Math.round((clearSpacePercent / 100) * dimensions.width)}px)
                </span>
                <img className={styles.logoImage} src={url} style={{ width: previewLogoW, height: previewLogoH }} alt="Logo" />
              </div>
            )}
          </div>
        }
        footer={
          <span className={imageStyles.statusRow}>
            {dimensions ? `Logo ${dimensions.width}×${dimensions.height}px · Minimum recommended size ${minWidth}×${minHeight}px` : "Import a logo to begin"}
          </span>
        }
      />
    </WorkspaceShell>
  );
}
