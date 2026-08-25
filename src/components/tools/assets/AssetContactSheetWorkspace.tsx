import { useState } from "react";
import { useFileImport } from "../../../hooks/useFileImport";
import { useObjectUrl } from "../../../hooks/useObjectUrl";
import { useObjectUrls } from "../../../hooks/useObjectUrls";
import { downloadBlob } from "../../../lib/downloadFile";
import { MultiFileStage } from "./MultiFileStage";
import { WorkspaceShell } from "../../workspace/WorkspaceShell";
import type { ToolDefinition } from "../../../types/tool";
import styles from "./MultiFile.module.css";

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Couldn't load one of the images."));
    img.src = url;
  });
}

export default function AssetContactSheetWorkspace({ tool }: { tool: ToolDefinition }) {
  const { files, error, importFiles, reset, removeFile } = useFileImport({ acceptedTypes: ["image/*"], multiple: true });
  const fileUrls = useObjectUrls(files);

  const [columns, setColumns] = useState(4);
  const [cellSize, setCellSize] = useState(220);
  const [spacing, setSpacing] = useState(12);
  const [showLabels, setShowLabels] = useState(true);
  const [background, setBackground] = useState("#f7f7f5");

  const [sheetBlob, setSheetBlob] = useState<Blob | null>(null);
  const sheetUrl = useObjectUrl(sheetBlob);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  const generate = async () => {
    if (files.length === 0) return;
    setGenerating(true);
    setGenError(null);

    try {
      const labelHeight = showLabels ? 34 : 0;
      const rows = Math.ceil(files.length / columns);
      const cellW = cellSize + spacing;
      const cellH = cellSize + labelHeight + spacing;

      const canvas = document.createElement("canvas");
      canvas.width = cellW * columns + spacing;
      canvas.height = cellH * rows + spacing;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("2D canvas context is not available.");
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const url = URL.createObjectURL(file);
        const img = await loadImage(url).finally(() => URL.revokeObjectURL(url));

        const col = i % columns;
        const row = Math.floor(i / columns);
        const cellX = spacing + col * cellW;
        const cellY = spacing + row * cellH;

        const scale = Math.min(cellSize / img.naturalWidth, cellSize / img.naturalHeight);
        const drawW = img.naturalWidth * scale;
        const drawH = img.naturalHeight * scale;
        const drawX = cellX + (cellSize - drawW) / 2;
        const drawY = cellY + (cellSize - drawH) / 2;

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(cellX, cellY, cellSize, cellSize);
        ctx.drawImage(img, drawX, drawY, drawW, drawH);
        ctx.strokeStyle = "rgba(17,17,17,0.1)";
        ctx.strokeRect(cellX, cellY, cellSize, cellSize);

        if (showLabels) {
          ctx.fillStyle = "#111111";
          ctx.font = "12px monospace";
          const label = `${file.name} · ${img.naturalWidth}×${img.naturalHeight}`;
          const maxChars = Math.floor(cellSize / 6.2);
          const truncated = label.length > maxChars ? `${label.slice(0, maxChars - 1)}…` : label;
          ctx.fillText(truncated, cellX, cellY + cellSize + 18);
        }
      }

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Couldn't generate the contact sheet."))), "image/png");
      });
      setSheetBlob(blob);
    } catch (err) {
      setGenError(err instanceof Error ? err.message : "Couldn't generate the contact sheet.");
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (sheetBlob) downloadBlob(sheetBlob, "asset-contact-sheet.png");
  };

  const handleClear = () => {
    reset();
    setSheetBlob(null);
  };

  return (
    <WorkspaceShell title={tool.name}>
      <MultiFileStage
        files={files}
        error={error}
        accept="image/*"
        dropLabel="Import images for the sheet"
        onFiles={importFiles}
        onClear={handleClear}
      >
        <div className={styles.layout}>
          <div className={styles.settings}>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Columns — {columns}</span>
              <input className={styles.slider} type="range" min={2} max={8} value={columns} onChange={(e) => setColumns(Number(e.target.value))} />
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Thumbnail size — {cellSize}px</span>
              <input
                className={styles.slider}
                type="range"
                min={120}
                max={360}
                step={10}
                value={cellSize}
                onChange={(e) => setCellSize(Number(e.target.value))}
              />
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Spacing — {spacing}px</span>
              <input className={styles.slider} type="range" min={0} max={40} value={spacing} onChange={(e) => setSpacing(Number(e.target.value))} />
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Background</span>
              <input type="color" value={background} onChange={(e) => setBackground(e.target.value)} />
            </div>
            <label className={styles.checkboxRow}>
              <input type="checkbox" checked={showLabels} onChange={(e) => setShowLabels(e.target.checked)} />
              Filename &amp; dimensions
            </label>
            <button className={styles.primaryButton} onClick={generate} disabled={files.length === 0 || generating}>
              {generating ? "Generating…" : "Generate contact sheet"}
            </button>
            {genError && <span className={styles.errorText}>{genError}</span>}
          </div>

          <div className={styles.grid}>
            {sheetUrl ? (
              <div style={{ gridColumn: "1 / -1" }}>
                <img src={sheetUrl} alt="Asset contact sheet" style={{ maxWidth: "100%", display: "block" }} />
              </div>
            ) : (
              files.map((file, index) => (
                <div className={styles.card} key={`${file.name}-${index}`}>
                  <img className={styles.cardThumb} src={fileUrls.get(file)} alt={file.name} />
                  <div className={styles.cardInfo}>
                    <span className={styles.cardName}>{file.name}</span>
                  </div>
                  <button className={styles.cardRemove} onClick={() => removeFile(index)} aria-label={`Remove ${file.name}`}>
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className={styles.footer}>
          <span className={styles.statusRow}>{sheetBlob ? "Contact sheet ready" : `${files.length} image${files.length === 1 ? "" : "s"} loaded`}</span>
          <button className={styles.primaryButton} disabled={!sheetBlob} onClick={handleDownload}>
            Download PNG
          </button>
        </div>
      </MultiFileStage>
    </WorkspaceShell>
  );
}
