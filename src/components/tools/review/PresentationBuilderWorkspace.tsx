import { useState } from "react";
import { useFileImport } from "../../../hooks/useFileImport";
import { useObjectUrls } from "../../../hooks/useObjectUrls";
import { buildPresentationHtml, renderSlideWithCaption, type Slide } from "../../../lib/presentationExport";
import { downloadBlob } from "../../../lib/downloadFile";
import { downloadAsZip } from "../../../lib/zipExport";
import { MultiFileStage } from "../assets/MultiFileStage";
import { WorkspaceShell } from "../../workspace/WorkspaceShell";
import type { ToolDefinition } from "../../../types/tool";
import imageStyles from "../image/ImageTool.module.css";
import assetStyles from "../assets/MultiFile.module.css";

export default function PresentationBuilderWorkspace({ tool }: { tool: ToolDefinition }) {
  const { files, error, importFiles, reset, removeFile } = useFileImport({ acceptedTypes: ["image/*"], multiple: true });
  const fileUrls = useObjectUrls(files);
  const [order, setOrder] = useState<number[]>([]);
  const [captions, setCaptions] = useState<Record<number, string>>({});
  const [exporting, setExporting] = useState(false);

  const indices = order.length === files.length ? order : files.map((_, i) => i);

  const move = (position: number, direction: -1 | 1) => {
    const target = position + direction;
    if (target < 0 || target >= indices.length) return;
    const next = [...indices];
    [next[position], next[target]] = [next[target], next[position]];
    setOrder(next);
  };

  const slides: Slide[] = indices.map((i) => ({ file: files[i], caption: captions[i] ?? "" })).filter((s) => !!s.file);

  const handleExportHtml = async () => {
    if (slides.length === 0) return;
    setExporting(true);
    try {
      const html = await buildPresentationHtml(slides);
      downloadBlob(new Blob([html], { type: "text/html" }), "presentation.html");
    } finally {
      setExporting(false);
    }
  };

  const handleExportZip = async () => {
    if (slides.length === 0) return;
    setExporting(true);
    try {
      const entries = await Promise.all(
        slides.map(async (slide, i) => ({
          name: `slide-${String(i + 1).padStart(2, "0")}.png`,
          data: new Uint8Array(await (await renderSlideWithCaption(slide)).arrayBuffer()),
        })),
      );
      await downloadAsZip(entries, "presentation-slides.zip");
    } finally {
      setExporting(false);
    }
  };

  const handleClear = () => {
    reset();
    setOrder([]);
    setCaptions({});
  };

  return (
    <WorkspaceShell title={tool.name}>
      <MultiFileStage files={files} error={error} accept="image/*" dropLabel="Import slides" onFiles={importFiles} onClear={handleClear}>
        <div className={assetStyles.grid}>
          {indices.map((fileIndex, position) => {
            const file = files[fileIndex];
            if (!file) return null;
            return (
              <div className={assetStyles.card} key={file.name + fileIndex}>
                <img className={assetStyles.cardThumb} src={fileUrls.get(file)} alt={file.name} />
                <div className={assetStyles.cardInfo}>
                  <span className={assetStyles.cardName}>Slide {position + 1}</span>
                  <input
                    className={imageStyles.input}
                    placeholder="Caption (optional)"
                    value={captions[fileIndex] ?? ""}
                    onChange={(e) => setCaptions((prev) => ({ ...prev, [fileIndex]: e.target.value }))}
                  />
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

        <div className={assetStyles.footer}>
          <span className={assetStyles.statusRow}>{slides.length} slide{slides.length === 1 ? "" : "s"}</span>
          <div className={imageStyles.row}>
            <button className={assetStyles.secondaryButton} disabled={slides.length === 0 || exporting} onClick={handleExportZip}>
              Export as image sequence (ZIP)
            </button>
            <button className={assetStyles.primaryButton} disabled={slides.length === 0 || exporting} onClick={handleExportHtml}>
              Export as HTML
            </button>
          </div>
        </div>
      </MultiFileStage>
    </WorkspaceShell>
  );
}
