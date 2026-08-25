import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useFileImport } from "../../../hooks/useFileImport";
import { useObjectUrls } from "../../../hooks/useObjectUrls";
import { useImageDimensions } from "../../../hooks/useImageDimensions";
import { formatBytes } from "../../../lib/format";
import { MultiFileStage } from "../assets/MultiFileStage";
import { WorkspaceShell } from "../../workspace/WorkspaceShell";
import type { ToolDefinition } from "../../../types/tool";
import assetStyles from "../assets/MultiFile.module.css";
import diffStyles from "../image/DifferenceWorkspace.module.css";
import imageStyles from "../image/ImageTool.module.css";

function VersionMeta({ file }: { file: File }) {
  const dimensions = useImageDimensions(file);
  return (
    <span className={assetStyles.cardDetail}>
      {dimensions ? `${dimensions.width}×${dimensions.height} · ` : ""}
      {formatBytes(file.size)}
    </span>
  );
}

export default function VersionComparatorWorkspace({ tool }: { tool: ToolDefinition }) {
  const { files, error, importFiles, reset, removeFile } = useFileImport({ acceptedTypes: ["image/*"], multiple: true });
  const fileUrls = useObjectUrls(files);
  const [mode, setMode] = useState<"grid" | "slider">("grid");
  const [leftIndex, setLeftIndex] = useState(0);
  const [rightIndex, setRightIndex] = useState(1);
  const [sliderPos, setSliderPos] = useState(50);

  const dragging = useRef(false);
  const stageRef = useRef<HTMLDivElement | null>(null);

  const versionLabel = (index: number) => (index === files.length - 1 ? "Final" : `V${index + 1}`);

  const updateSliderFromClientX = (clientX: number) => {
    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    const percent = ((clientX - rect.left) / rect.width) * 100;
    setSliderPos(Math.min(100, Math.max(0, percent)));
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
    updateSliderFromClientX(event.clientX);
  };
  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    updateSliderFromClientX(event.clientX);
  };
  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    dragging.current = false;
    if ((event.target as HTMLElement).hasPointerCapture(event.pointerId)) {
      (event.target as HTMLElement).releasePointerCapture(event.pointerId);
    }
  };

  const handleClear = () => reset();

  const leftFile = files[leftIndex];
  const rightFile = files[rightIndex];

  return (
    <WorkspaceShell title={tool.name}>
      <MultiFileStage files={files} error={error} accept="image/*" dropLabel="Import versions to compare" onFiles={importFiles} onClear={handleClear}>
        <div className={assetStyles.chipRow} style={{ marginBottom: "var(--space-4)" }}>
          <button className={assetStyles.chip} data-active={mode === "grid"} onClick={() => setMode("grid")}>
            Side-by-Side
          </button>
          <button className={assetStyles.chip} data-active={mode === "slider"} onClick={() => setMode("slider")}>
            Slider
          </button>
        </div>

        {mode === "grid" && (
          <div className={assetStyles.grid}>
            {files.map((file, index) => (
              <div className={assetStyles.card} key={file.name + index}>
                <img className={assetStyles.cardThumb} src={fileUrls.get(file)} alt={versionLabel(index)} />
                <div className={assetStyles.cardInfo}>
                  <span className={assetStyles.cardName}>{versionLabel(index)} — {file.name}</span>
                  <VersionMeta file={file} />
                </div>
                <button className={assetStyles.cardRemove} onClick={() => removeFile(index)} aria-label={`Remove ${file.name}`}>
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {mode === "slider" && files.length >= 2 && (
          <>
            <div className={imageStyles.row} style={{ marginBottom: "var(--space-3)", gap: "var(--space-4)" }}>
              <div className={imageStyles.field}>
                <span className={imageStyles.fieldLabel}>Left</span>
                <select className={imageStyles.select} value={leftIndex} onChange={(e) => setLeftIndex(Number(e.target.value))}>
                  {files.map((f, i) => (
                    <option key={f.name + i} value={i}>
                      {versionLabel(i)} — {f.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className={imageStyles.field}>
                <span className={imageStyles.fieldLabel}>Right</span>
                <select className={imageStyles.select} value={rightIndex} onChange={(e) => setRightIndex(Number(e.target.value))}>
                  {files.map((f, i) => (
                    <option key={f.name + i} value={i}>
                      {versionLabel(i)} — {f.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {leftFile && rightFile && (
              <div className={diffStyles.stage}>
                <div
                  className={diffStyles.sliderStage}
                  ref={stageRef}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                >
                  <img src={fileUrls.get(rightFile)} alt={versionLabel(rightIndex)} />
                  <div className={diffStyles.sliderTop} style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}>
                    <img src={fileUrls.get(leftFile)} alt={versionLabel(leftIndex)} />
                  </div>
                  <div className={diffStyles.sliderHandle} style={{ left: `${sliderPos}%` }} />
                </div>
              </div>
            )}
          </>
        )}

        {mode === "slider" && files.length < 2 && (
          <span className={assetStyles.statusRow}>Import at least 2 versions to use the slider.</span>
        )}
      </MultiFileStage>
    </WorkspaceShell>
  );
}
