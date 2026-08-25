import { useEffect, useState } from "react";
import { useFileImport } from "../../../hooks/useFileImport";
import { readImageInfo } from "../../../lib/imageInfo";
import { ratioLabel } from "../../../lib/preflight";
import { formatBytes } from "../../../lib/format";
import { MultiFileStage } from "./MultiFileStage";
import { WorkspaceShell } from "../../workspace/WorkspaceShell";
import type { ToolDefinition } from "../../../types/tool";
import styles from "./MultiFile.module.css";

interface ScannedFile {
  file: File;
  width: number;
  height: number;
}

type SortKey = "name" | "width" | "ratio" | "size" | "format";

export default function DimensionScannerWorkspace({ tool }: { tool: ToolDefinition }) {
  const { files, error, importFiles, reset, removeFile } = useFileImport({ acceptedTypes: ["image/*"], multiple: true });
  const [scanned, setScanned] = useState<ScannedFile[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortAsc, setSortAsc] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      files.map(async (file) => {
        try {
          const info = await readImageInfo(file);
          return { file, width: info.width, height: info.height };
        } catch {
          return { file, width: 0, height: 0 };
        }
      }),
    ).then((results) => {
      if (!cancelled) setScanned(results);
    });
    return () => {
      cancelled = true;
    };
  }, [files]);

  const sorted = [...scanned].sort((a, b) => {
    let result = 0;
    if (sortKey === "name") result = a.file.name.localeCompare(b.file.name);
    else if (sortKey === "width") result = a.width - b.width;
    else if (sortKey === "ratio") result = a.width / a.height - b.width / b.height;
    else if (sortKey === "size") result = a.file.size - b.file.size;
    else if (sortKey === "format") result = a.file.type.localeCompare(b.file.type);
    return sortAsc ? result : -result;
  });

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((prev) => !prev);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const handleClear = () => {
    reset();
    setScanned([]);
  };

  return (
    <WorkspaceShell title={tool.name}>
      <MultiFileStage
        files={files}
        error={error}
        accept="image/*"
        dropLabel="Import images to scan"
        onFiles={importFiles}
        onClear={handleClear}
      >
        <table className={styles.table}>
          <thead>
            <tr>
              <th onClick={() => toggleSort("name")}>File</th>
              <th onClick={() => toggleSort("width")}>Dimensions</th>
              <th onClick={() => toggleSort("ratio")}>Ratio</th>
              <th onClick={() => toggleSort("size")}>Size</th>
              <th onClick={() => toggleSort("format")}>Format</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {sorted.map((item, index) => (
              <tr key={`${item.file.name}-${index}`}>
                <td>{item.file.name}</td>
                <td className="mono">
                  {item.width}×{item.height}
                </td>
                <td className="mono">{item.width && item.height ? ratioLabel(item.width, item.height) : "—"}</td>
                <td className="mono">{formatBytes(item.file.size)}</td>
                <td className="mono">{item.file.type || "unknown"}</td>
                <td>
                  <button className={styles.secondaryButton} onClick={() => removeFile(files.indexOf(item.file))}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className={styles.footer}>
          <span className={styles.statusRow}>{scanned.length} file{scanned.length === 1 ? "" : "s"} scanned</span>
        </div>
      </MultiFileStage>
    </WorkspaceShell>
  );
}
