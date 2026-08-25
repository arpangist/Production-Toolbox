import { useState } from "react";
import { useFileImport } from "../../../hooks/useFileImport";
import { useObjectUrls } from "../../../hooks/useObjectUrls";
import { MultiFileStage } from "../assets/MultiFileStage";
import { WorkspaceShell } from "../../workspace/WorkspaceShell";
import type { ToolDefinition } from "../../../types/tool";
import assetStyles from "../assets/MultiFile.module.css";
import styles from "./ProfileGridWorkspace.module.css";

export default function ProfileGridWorkspace({ tool }: { tool: ToolDefinition }) {
  const { files, error, importFiles, reset, removeFile } = useFileImport({ acceptedTypes: ["image/*"], multiple: true });
  const fileUrls = useObjectUrls(files);
  const [order, setOrder] = useState<number[]>([]);
  const [columns, setColumns] = useState<3 | 4>(3);
  const [device, setDevice] = useState<"desktop" | "mobile">("mobile");

  const indices = order.length === files.length ? order : files.map((_, i) => i);

  const move = (position: number, direction: -1 | 1) => {
    const target = position + direction;
    if (target < 0 || target >= indices.length) return;
    const next = [...indices];
    [next[position], next[target]] = [next[target], next[position]];
    setOrder(next);
  };

  const handleRemove = (fileIndex: number) => {
    removeFile(fileIndex);
    setOrder([]);
  };

  const handleClear = () => {
    reset();
    setOrder([]);
  };

  return (
    <WorkspaceShell title={tool.name}>
      <MultiFileStage files={files} error={error} accept="image/*" dropLabel="Import posts" onFiles={importFiles} onClear={handleClear}>
        <div className={assetStyles.chipRow}>
          <button className={assetStyles.chip} data-active={columns === 3} onClick={() => setColumns(3)}>
            3 columns
          </button>
          <button className={assetStyles.chip} data-active={columns === 4} onClick={() => setColumns(4)}>
            4 columns
          </button>
          <button className={assetStyles.chip} data-active={device === "desktop"} onClick={() => setDevice("desktop")}>
            Desktop width
          </button>
          <button className={assetStyles.chip} data-active={device === "mobile"} onClick={() => setDevice("mobile")}>
            Mobile width
          </button>
        </div>

        <div
          className={styles.grid}
          data-columns={columns}
          style={{
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            maxWidth: device === "mobile" ? 360 : 560,
          }}
        >
          {indices.map((fileIndex, position) => {
            const file = files[fileIndex];
            if (!file) return null;
            return (
              <div className={styles.cell} key={file.name + fileIndex}>
                <img className={styles.cellImage} src={fileUrls.get(file)} alt={file.name} />
                <div className={styles.cellControls}>
                  <button className={styles.cellButton} onClick={() => move(position, -1)} aria-label="Move earlier" disabled={position === 0}>
                    ←
                  </button>
                  <button className={styles.cellButton} onClick={() => handleRemove(fileIndex)} aria-label="Remove">
                    ×
                  </button>
                  <button
                    className={styles.cellButton}
                    onClick={() => move(position, 1)}
                    aria-label="Move later"
                    disabled={position === indices.length - 1}
                  >
                    →
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className={assetStyles.footer}>
          <span className={assetStyles.statusRow}>{files.length} post{files.length === 1 ? "" : "s"} in the grid</span>
        </div>
      </MultiFileStage>
    </WorkspaceShell>
  );
}
