import { useEffect, useMemo, useRef, useState } from "react";
import { useFileImport } from "../../../hooks/useFileImport";
import { useObjectUrls } from "../../../hooks/useObjectUrls";
import { WorkerPool } from "../../../workers/workerPool";
import type { ChecksumResult } from "../../../workers/checksum.worker";
import { computeAverageHash, hammingDistance } from "../../../lib/perceptualHash";
import { formatBytes } from "../../../lib/format";
import { downloadAsZip } from "../../../lib/zipExport";
import { MultiFileStage } from "./MultiFileStage";
import { WorkspaceShell } from "../../workspace/WorkspaceShell";
import type { ToolDefinition } from "../../../types/tool";
import styles from "./MultiFile.module.css";

interface ScannedItem {
  file: File;
  hash: string;
  phash: string | null;
}

const SIMILARITY_THRESHOLD = 6; // out of 64 bits

export default function DuplicateFinderWorkspace({ tool }: { tool: ToolDefinition }) {
  const { files, error, importFiles, reset, removeFile } = useFileImport({ multiple: true });
  const fileUrls = useObjectUrls(files);
  const [items, setItems] = useState<ScannedItem[]>([]);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [scanError, setScanError] = useState<string | null>(null);
  const poolRef = useRef<WorkerPool | null>(null);

  const getPool = () => {
    if (!poolRef.current) {
      poolRef.current = new WorkerPool(() => new Worker(new URL("../../../workers/checksum.worker.ts", import.meta.url), { type: "module" }));
    }
    return poolRef.current;
  };

  useEffect(() => () => poolRef.current?.dispose(), []);

  useEffect(() => {
    if (files.length === 0) {
      setItems([]);
      return;
    }

    let cancelled = false;
    setScanning(true);
    setScanError(null);
    setProgress(0);

    (async () => {
      const pool = getPool();
      const results: ScannedItem[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const { hash } = await pool.run<ChecksumResult>(file).promise;
        const phash = file.type.startsWith("image/") ? await computeAverageHash(file).catch(() => null) : null;
        results.push({ file, hash, phash });
        if (!cancelled) setProgress((i + 1) / files.length);
      }
      if (!cancelled) {
        setItems(results);
        setScanning(false);
      }
    })().catch((err: Error) => {
      if (!cancelled) {
        setScanError(err.message);
        setScanning(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [files]);

  const { exactGroups, similarGroups } = useMemo(() => {
    const byHash = new Map<string, ScannedItem[]>();
    for (const item of items) {
      const bucket = byHash.get(item.hash) ?? [];
      bucket.push(item);
      byHash.set(item.hash, bucket);
    }
    const exact = [...byHash.values()].filter((group) => group.length > 1);
    const exactFiles = new Set(exact.flat().map((i) => i.file));

    const remaining = items.filter((i) => i.phash && !exactFiles.has(i.file));
    const similar: ScannedItem[][] = [];
    const used = new Set<ScannedItem>();
    for (let i = 0; i < remaining.length; i++) {
      if (used.has(remaining[i])) continue;
      const group = [remaining[i]];
      for (let j = i + 1; j < remaining.length; j++) {
        if (used.has(remaining[j])) continue;
        if (hammingDistance(remaining[i].phash!, remaining[j].phash!) <= SIMILARITY_THRESHOLD) {
          group.push(remaining[j]);
          used.add(remaining[j]);
        }
      }
      if (group.length > 1) {
        used.add(remaining[i]);
        similar.push(group);
      }
    }

    return { exactGroups: exact, similarGroups: similar };
  }, [items]);

  const duplicateCount = exactGroups.reduce((sum, g) => sum + g.length - 1, 0);

  const handleDownloadUnique = async () => {
    const seen = new Set<string>();
    const unique: File[] = [];
    for (const item of items) {
      if (seen.has(item.hash)) continue;
      seen.add(item.hash);
      unique.push(item.file);
    }
    const entries = await Promise.all(
      unique.map(async (file) => ({ name: file.name, data: new Uint8Array(await file.arrayBuffer()) })),
    );
    await downloadAsZip(entries, "unique-files.zip");
  };

  const handleClear = () => {
    reset();
    setItems([]);
  };

  return (
    <WorkspaceShell title={tool.name}>
      <MultiFileStage files={files} error={error} accept="*" dropLabel="Import files to scan" dropHint="Any file type" onFiles={importFiles} onClear={handleClear}>
        <div className={styles.grid}>
          {files.map((file, index) => (
            <div className={styles.card} key={`${file.name}-${index}`}>
              {file.type.startsWith("image/") ? (
                <img className={styles.cardThumb} src={fileUrls.get(file)} alt={file.name} />
              ) : (
                <div className={styles.cardThumb} aria-hidden="true" />
              )}
              <div className={styles.cardInfo}>
                <span className={styles.cardName}>{file.name}</span>
                <span className={styles.cardDetail}>{formatBytes(file.size)}</span>
              </div>
              <button className={styles.cardRemove} onClick={() => removeFile(index)} aria-label={`Remove ${file.name}`}>
                ×
              </button>
            </div>
          ))}
        </div>

        {scanning && (
          <span className={styles.statusRow} role="status" aria-live="polite">
            Scanning… {Math.round(progress * 100)}%
          </span>
        )}
        {scanError && <span className={styles.errorText}>{scanError}</span>}

        {!scanning && items.length > 0 && (
          <>
            {exactGroups.length === 0 && similarGroups.length === 0 && (
              <span className={styles.statusRow}>No duplicates or similar files found.</span>
            )}
            {exactGroups.map((group, gi) => (
              <div className={styles.group} key={`exact-${gi}`}>
                <span className={styles.groupTitle}>
                  <span className={styles.badge} data-kind="exact">
                    Exact duplicate
                  </span>
                  {group.length} files, identical content
                </span>
                <div className={styles.groupRow}>
                  {group.map((item, i) => (
                    <div className={styles.card} key={item.file.name + i} style={{ width: 140 }}>
                      {item.file.type.startsWith("image/") && (
                        <img className={styles.cardThumb} src={fileUrls.get(item.file)} alt={item.file.name} />
                      )}
                      <div className={styles.cardInfo}>
                        <span className={styles.cardName}>{i === 0 ? "Original — " : "Duplicate — "}{item.file.name}</span>
                        <span className={styles.cardDetail}>{formatBytes(item.file.size)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {similarGroups.map((group, gi) => (
              <div className={styles.group} key={`similar-${gi}`}>
                <span className={styles.groupTitle}>
                  <span className={styles.badge} data-kind="similar">
                    Possibly similar
                  </span>
                  {group.length} images look alike
                </span>
                <div className={styles.groupRow}>
                  {group.map((item, i) => (
                    <div className={styles.card} key={item.file.name + i} style={{ width: 140 }}>
                      <img className={styles.cardThumb} src={fileUrls.get(item.file)} alt={item.file.name} />
                      <div className={styles.cardInfo}>
                        <span className={styles.cardName}>{item.file.name}</span>
                        <span className={styles.cardDetail}>{formatBytes(item.file.size)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}

        <div className={styles.footer}>
          <span className={styles.statusRow}>
            {items.length > 0 ? `${duplicateCount} exact duplicate${duplicateCount === 1 ? "" : "s"} found` : "Import files to scan"}
          </span>
          <button className={styles.primaryButton} disabled={items.length === 0} onClick={handleDownloadUnique}>
            Download unique files as ZIP
          </button>
        </div>
      </MultiFileStage>
    </WorkspaceShell>
  );
}
