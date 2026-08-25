import { useMemo, useState } from "react";
import { useFileImport } from "../../../hooks/useFileImport";
import { buildFileName, type RenameFields } from "../../../lib/batchRename";
import { downloadAsZip } from "../../../lib/zipExport";
import { formatBytes } from "../../../lib/format";
import { MultiFileStage } from "./MultiFileStage";
import { WorkspaceShell } from "../../workspace/WorkspaceShell";
import type { ToolDefinition } from "../../../types/tool";
import styles from "./MultiFile.module.css";

const TOKENS = ["{project}", "{client}", "{date}", "{number}", "{original}"];

export default function BatchRenamerWorkspace({ tool }: { tool: ToolDefinition }) {
  const { files, error, importFiles, reset, removeFile } = useFileImport({ multiple: true });

  const [project, setProject] = useState("project");
  const [client, setClient] = useState("client");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [pattern, setPattern] = useState("{project}_{client}_{number}");
  const [numberStart, setNumberStart] = useState(1);
  const [numberPadding, setNumberPadding] = useState(3);
  const [downloading, setDownloading] = useState(false);

  const fields: RenameFields = { project, client, date, pattern, numberStart, numberPadding };

  const renamed = useMemo(
    () => files.map((file, index) => ({ file, newName: buildFileName(file.name, index, fields) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [files, project, client, date, pattern, numberStart, numberPadding],
  );

  const hasCollision = useMemo(() => {
    const seen = new Set<string>();
    for (const { newName } of renamed) {
      if (seen.has(newName)) return true;
      seen.add(newName);
    }
    return false;
  }, [renamed]);

  const insertToken = (token: string) => setPattern((prev) => `${prev}${token}`);

  const handleDownload = async () => {
    if (renamed.length === 0) return;
    setDownloading(true);
    try {
      const entries = await Promise.all(
        renamed.map(async ({ file, newName }) => ({ name: newName, data: new Uint8Array(await file.arrayBuffer()) })),
      );
      await downloadAsZip(entries, "renamed-files.zip");
    } finally {
      setDownloading(false);
    }
  };

  const handleClear = () => reset();

  return (
    <WorkspaceShell title={tool.name}>
      <MultiFileStage files={files} error={error} accept="*" dropLabel="Import files to rename" onFiles={importFiles} onClear={handleClear}>
        <div className={styles.layout}>
          <div className={styles.settings}>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Project</span>
              <input className={styles.input} value={project} onChange={(e) => setProject(e.target.value)} />
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Client</span>
              <input className={styles.input} value={client} onChange={(e) => setClient(e.target.value)} />
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Date</span>
              <input className={styles.input} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Start number / padding</span>
              <div style={{ display: "flex", gap: "var(--space-2)" }}>
                <input
                  className={styles.input}
                  type="number"
                  min={0}
                  value={numberStart}
                  onChange={(e) => setNumberStart(Number(e.target.value))}
                  aria-label="Start number"
                />
                <select
                  className={styles.select}
                  value={numberPadding}
                  onChange={(e) => setNumberPadding(Number(e.target.value))}
                  aria-label="Number padding"
                >
                  {[1, 2, 3, 4].map((p) => (
                    <option key={p} value={p}>
                      {String(1).padStart(p, "0")}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Pattern</span>
              <input className={styles.input} value={pattern} onChange={(e) => setPattern(e.target.value)} />
              <div className={styles.chipRow}>
                {TOKENS.map((token) => (
                  <button key={token} className={styles.chip} onClick={() => insertToken(token)}>
                    {token}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Original</th>
                  <th>New name</th>
                  <th>Size</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {renamed.map(({ file, newName }, index) => (
                  <tr key={`${file.name}-${index}`}>
                    <td>{file.name}</td>
                    <td className="mono">{newName}</td>
                    <td>{formatBytes(file.size)}</td>
                    <td>
                      <button className={styles.secondaryButton} onClick={() => removeFile(index)}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {hasCollision && (
              <p className={styles.errorText} role="alert" style={{ marginTop: "var(--space-2)" }}>
                Two or more files would get the same name — adjust the pattern or numbering.
              </p>
            )}
          </div>
        </div>

        <div className={styles.footer}>
          <span className={styles.statusRow}>{renamed.length} file{renamed.length === 1 ? "" : "s"} will be renamed</span>
          <button className={styles.primaryButton} disabled={renamed.length === 0 || hasCollision || downloading} onClick={handleDownload}>
            {downloading ? "Packaging…" : "Download renamed files as ZIP"}
          </button>
        </div>
      </MultiFileStage>
    </WorkspaceShell>
  );
}
