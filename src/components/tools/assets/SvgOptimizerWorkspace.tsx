import { useEffect, useMemo, useState } from "react";
import { useFileImport } from "../../../hooks/useFileImport";
import { useObjectUrl } from "../../../hooks/useObjectUrl";
import { DEFAULT_SVG_OPTIONS, byteSize, optimizeSvg, type SvgOptimizeOptions } from "../../../lib/svgOptimize";
import { downloadBlob } from "../../../lib/downloadFile";
import { downloadAsZip } from "../../../lib/zipExport";
import { formatBytes } from "../../../lib/format";
import { MultiFileStage } from "./MultiFileStage";
import { WorkspaceShell } from "../../workspace/WorkspaceShell";
import type { ToolDefinition } from "../../../types/tool";
import styles from "./MultiFile.module.css";

interface SvgEntry {
  file: File;
  original: string;
  optimized: string;
}

export default function SvgOptimizerWorkspace({ tool }: { tool: ToolDefinition }) {
  const { files, error, importFiles, reset } = useFileImport({ acceptedTypes: [".svg", "image/svg+xml"], multiple: true });
  const [sources, setSources] = useState<{ file: File; text: string }[]>([]);
  const [options, setOptions] = useState<SvgOptimizeOptions>(DEFAULT_SVG_OPTIONS);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [readError, setReadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all(files.map(async (file) => ({ file, text: await file.text() })))
      .then((results) => {
        if (!cancelled) setSources(results);
      })
      .catch(() => {
        if (!cancelled) setReadError("Couldn't read one of the SVG files.");
      });
    return () => {
      cancelled = true;
    };
  }, [files]);

  const entries: SvgEntry[] = useMemo(
    () => sources.map(({ file, text }) => ({ file, original: text, optimized: optimizeSvg(text, options) })),
    [sources, options],
  );

  const selected = entries[selectedIndex] ?? entries[0];

  const originalBlob = useMemo(
    () => (selected ? new Blob([selected.original], { type: "image/svg+xml" }) : null),
    [selected],
  );
  const optimizedBlob = useMemo(
    () => (selected ? new Blob([selected.optimized], { type: "image/svg+xml" }) : null),
    [selected],
  );
  const originalUrl = useObjectUrl(originalBlob);
  const optimizedUrl = useObjectUrl(optimizedBlob);

  const toggle = (key: keyof SvgOptimizeOptions) => setOptions((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleDownloadOne = () => {
    if (!selected) return;
    downloadBlob(new Blob([selected.optimized], { type: "image/svg+xml" }), selected.file.name.replace(/\.svg$/i, ".min.svg"));
  };

  const handleDownloadAll = async () => {
    if (entries.length === 0) return;
    const zipEntries = entries.map((entry) => ({
      name: entry.file.name.replace(/\.svg$/i, ".min.svg"),
      data: new TextEncoder().encode(entry.optimized),
    }));
    await downloadAsZip(zipEntries, "optimized-svgs.zip");
  };

  const handleClear = () => {
    reset();
    setSources([]);
    setSelectedIndex(0);
  };

  return (
    <WorkspaceShell title={tool.name}>
      <MultiFileStage
        files={files}
        error={error || readError}
        accept=".svg,image/svg+xml"
        dropLabel="Import SVG files"
        onFiles={importFiles}
        onClear={handleClear}
      >
        <div className={styles.layout}>
          <div className={styles.settings}>
            <label className={styles.checkboxRow}>
              <input type="checkbox" checked={options.removeComments} onChange={() => toggle("removeComments")} />
              Remove comments
            </label>
            <label className={styles.checkboxRow}>
              <input type="checkbox" checked={options.removeMetadata} onChange={() => toggle("removeMetadata")} />
              Remove metadata, title &amp; desc
            </label>
            <label className={styles.checkboxRow}>
              <input type="checkbox" checked={options.removeEditorAttrs} onChange={() => toggle("removeEditorAttrs")} />
              Remove editor attributes
            </label>
            <label className={styles.checkboxRow}>
              <input type="checkbox" checked={options.collapseWhitespace} onChange={() => toggle("collapseWhitespace")} />
              Collapse whitespace
            </label>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Numeric precision — {options.roundPrecision} decimals</span>
              <input
                className={styles.slider}
                type="range"
                min={0}
                max={4}
                value={options.roundPrecision}
                onChange={(e) => setOptions((prev) => ({ ...prev, roundPrecision: Number(e.target.value) }))}
              />
            </div>

            {entries.length > 1 && (
              <div className={styles.field}>
                <span className={styles.fieldLabel}>File</span>
                <select className={styles.select} value={selectedIndex} onChange={(e) => setSelectedIndex(Number(e.target.value))}>
                  {entries.map((entry, index) => (
                    <option key={entry.file.name} value={index}>
                      {entry.file.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {selected && (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
                <div className={styles.card} style={{ padding: "var(--space-3)" }}>
                  <span className={styles.fieldLabel}>Original — {formatBytes(byteSize(selected.original))}</span>
                  {originalUrl && <img src={originalUrl} alt="Original SVG" style={{ width: "100%", height: 160, objectFit: "contain" }} />}
                </div>
                <div className={styles.card} style={{ padding: "var(--space-3)" }}>
                  <span className={styles.fieldLabel}>Optimized — {formatBytes(byteSize(selected.optimized))}</span>
                  {optimizedUrl && <img src={optimizedUrl} alt="Optimized SVG" style={{ width: "100%", height: 160, objectFit: "contain" }} />}
                </div>
              </div>
              <button className={styles.secondaryButton} onClick={handleDownloadOne}>
                Download this file
              </button>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <span className={styles.statusRow}>
            {entries.length > 0 &&
              `Total: ${formatBytes(entries.reduce((s, e) => s + byteSize(e.original), 0))} → ${formatBytes(
                entries.reduce((s, e) => s + byteSize(e.optimized), 0),
              )}`}
          </span>
          <button className={styles.primaryButton} disabled={entries.length === 0} onClick={handleDownloadAll}>
            Download all as ZIP
          </button>
        </div>
      </MultiFileStage>
    </WorkspaceShell>
  );
}
