import { useState } from "react";
import { useFileImport } from "../../../hooks/useFileImport";
import { downloadAsZip } from "../../../lib/zipExport";
import { formatBytes } from "../../../lib/format";
import { MultiFileStage } from "../assets/MultiFileStage";
import { WorkspaceShell } from "../../workspace/WorkspaceShell";
import type { ToolDefinition } from "../../../types/tool";
import imageStyles from "../image/ImageTool.module.css";
import assetStyles from "../assets/MultiFile.module.css";

export default function ZipAssetBuilderWorkspace({ tool }: { tool: ToolDefinition }) {
  const { files, error, importFiles, reset, removeFile } = useFileImport({ multiple: true });
  const [folderName, setFolderName] = useState("PROJECT_FINAL");
  const [paths, setPaths] = useState<Record<string, string>>({});
  const [includeReadme, setIncludeReadme] = useState(true);
  const [readmeText, setReadmeText] = useState("Assets exported from Creative Production Toolbox.");
  const [building, setBuilding] = useState(false);

  const pathFor = (file: File, index: number) => paths[`${file.name}-${index}`] ?? file.name;

  const setPathFor = (file: File, index: number, value: string) => {
    setPaths((prev) => ({ ...prev, [`${file.name}-${index}`]: value }));
  };

  const buildZip = async () => {
    if (files.length === 0) return;
    setBuilding(true);
    try {
      const prefix = folderName.trim() ? `${folderName.trim()}/` : "";
      const entries = await Promise.all(
        files.map(async (file, index) => ({
          name: `${prefix}${pathFor(file, index)}`,
          data: new Uint8Array(await file.arrayBuffer()),
        })),
      );
      if (includeReadme) {
        entries.push({ name: `${prefix}README.txt`, data: new TextEncoder().encode(readmeText) });
      }
      await downloadAsZip(entries, `${folderName.trim() || "assets"}.zip`);
    } finally {
      setBuilding(false);
    }
  };

  const handleClear = () => {
    reset();
    setPaths({});
  };

  return (
    <WorkspaceShell title={tool.name}>
      <MultiFileStage files={files} error={error} accept="*" dropLabel="Import files to package" onFiles={importFiles} onClear={handleClear}>
        <div className={imageStyles.row} style={{ flexWrap: "wrap", gap: "var(--space-4)", marginBottom: "var(--space-4)" }}>
          <div className={imageStyles.field}>
            <span className={imageStyles.fieldLabel}>Folder name</span>
            <input className={imageStyles.input} value={folderName} onChange={(e) => setFolderName(e.target.value)} />
          </div>
          <label className={imageStyles.checkboxRow} style={{ alignSelf: "flex-end", marginBottom: 6 }}>
            <input type="checkbox" checked={includeReadme} onChange={(e) => setIncludeReadme(e.target.checked)} />
            Include README.txt
          </label>
        </div>

        {includeReadme && (
          <textarea
            className={imageStyles.input}
            value={readmeText}
            onChange={(e) => setReadmeText(e.target.value)}
            rows={2}
            style={{ width: "100%", marginBottom: "var(--space-4)", fontFamily: "inherit" }}
          />
        )}

        <table className={assetStyles.table}>
          <thead>
            <tr>
              <th>Original</th>
              <th>Path in ZIP</th>
              <th>Size</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {files.map((file, index) => (
              <tr key={`${file.name}-${index}`}>
                <td>{file.name}</td>
                <td>
                  <input
                    className={imageStyles.input}
                    value={pathFor(file, index)}
                    onChange={(e) => setPathFor(file, index, e.target.value)}
                  />
                </td>
                <td>{formatBytes(file.size)}</td>
                <td>
                  <button className={assetStyles.secondaryButton} onClick={() => removeFile(index)}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className={assetStyles.footer}>
          <span className={assetStyles.statusRow}>
            {files.length} file{files.length === 1 ? "" : "s"} · {formatBytes(files.reduce((s, f) => s + f.size, 0))}
          </span>
          <button className={assetStyles.primaryButton} disabled={files.length === 0 || building} onClick={buildZip}>
            {building ? "Building…" : "Download ZIP"}
          </button>
        </div>
      </MultiFileStage>
    </WorkspaceShell>
  );
}
