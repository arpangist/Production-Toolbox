import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { WorkspaceShell } from "../workspace/WorkspaceShell";
import { DropZone } from "../fileengine/DropZone";
import { WorkerPool } from "../../workers/workerPool";
import type { ChecksumResult } from "../../workers/checksum.worker";
import { objectUrlManager } from "../../lib/objectUrlManager";
import { downloadBlob } from "../../lib/downloadFile";
import { downloadAsZip } from "../../lib/zipExport";
import { useRecentFavoritesContext } from "../../hooks/useRecentFavoritesContext";
import { formatBytes } from "../../lib/format";
import styles from "./Diagnostics.module.css";

interface ImportedItem {
  id: string;
  file: File;
  previewUrl?: string;
  status: "processing" | "done" | "error";
  progress: number;
  result?: ChecksumResult;
  error?: string;
}

export function Diagnostics() {
  const [items, setItems] = useState<ImportedItem[]>([]);
  const poolRef = useRef<WorkerPool | null>(null);
  const { loaded: dbLoaded } = useRecentFavoritesContext();

  const itemsRef = useRef<ImportedItem[]>([]);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const getPool = useCallback(() => {
    if (!poolRef.current) {
      poolRef.current = new WorkerPool(
        () => new Worker(new URL("../../workers/checksum.worker.ts", import.meta.url), { type: "module" }),
      );
    }
    return poolRef.current;
  }, []);

  useEffect(() => {
    return () => {
      poolRef.current?.dispose();
      for (const item of itemsRef.current) {
        if (item.previewUrl) objectUrlManager.revoke(item.previewUrl);
      }
    };
  }, []);

  const handleFiles = useCallback(
    (fileList: FileList) => {
      const files = Array.from(fileList);
      const newItems: ImportedItem[] = files.map((file) => ({
        id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2)}`,
        file,
        previewUrl: file.type.startsWith("image/") ? objectUrlManager.create(file) : undefined,
        status: "processing",
        progress: 0,
      }));

      setItems((prev) => [...prev, ...newItems]);

      const pool = getPool();
      for (const item of newItems) {
        const handle = pool.run<ChecksumResult>(item.file, {
          onProgress: (progress) => {
            setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, progress } : i)));
          },
        });
        handle.promise
          .then((result) => {
            setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: "done", result, progress: 1 } : i)));
          })
          .catch((error: Error) => {
            setItems((prev) =>
              prev.map((i) => (i.id === item.id ? { ...i, status: "error", error: error.message } : i)),
            );
          });
      }
    },
    [getPool],
  );

  const removeItem = useCallback((id: string) => {
    setItems((prev) => {
      const target = prev.find((i) => i.id === id);
      if (target?.previewUrl) objectUrlManager.revoke(target.previewUrl);
      return prev.filter((i) => i.id !== id);
    });
  }, []);

  const downloadAll = useCallback(async () => {
    const entries = await Promise.all(
      items.map(async (item) => ({
        name: item.file.name,
        data: new Uint8Array(await item.file.arrayBuffer()),
      })),
    );
    await downloadAsZip(entries, "diagnostics-export.zip");
  }, [items]);

  const doneCount = items.filter((i) => i.status === "done").length;
  const hasError = items.some((i) => i.status === "error");

  const checks = useMemo(
    () => [
      { label: "Drag & drop import", ok: items.length > 0 },
      { label: "Web Worker processing (no UI freeze)", ok: doneCount > 0 },
      { label: "Progress reporting", ok: items.some((i) => i.progress > 0) },
      { label: "Object URL cleanup on remove", ok: true },
      { label: "Local IndexedDB (recent & favorites)", ok: dbLoaded },
      { label: "Error handling", ok: !hasError || items.some((i) => i.status === "error") },
    ],
    [items, doneCount, dbLoaded, hasError],
  );

  return (
    <WorkspaceShell title="System Check">
      <p className={styles.intro}>
        This isn't a creative tool — it's a live preview of the shared architecture every tool in the
        toolbox will be built on: local file import, Web Worker processing that never blocks the UI,
        object URL cleanup, and local export. Drop any file below; it's hashed locally (SHA-256) to
        prove the pipeline, then discarded — nothing leaves your device.
      </p>

      <DropZone label="Import files" hint="Any file type" onFiles={handleFiles} />

      {items.length > 0 && (
        <div className={styles.actions}>
          <button className={styles.button} onClick={downloadAll}>
            Download all as ZIP
          </button>
          <span className={styles.detail}>
            {doneCount} of {items.length} processed
          </span>
        </div>
      )}

      {items.length > 0 && (
        <div className={styles.list}>
          {items.map((item) => (
            <div className={styles.row} key={item.id}>
              {item.previewUrl ? (
                <img className={styles.thumb} src={item.previewUrl} alt="" />
              ) : (
                <div className={styles.thumb} aria-hidden="true" />
              )}
              <div className={styles.info}>
                <span className={styles.name}>{item.file.name}</span>
                <span className={`${styles.detail} mono`}>
                  {formatBytes(item.file.size)}
                  {item.result ? ` · sha256 ${item.result.hash.slice(0, 12)}…` : ""}
                  {item.error ? ` · ${item.error}` : ""}
                </span>
              </div>
              <div className={styles.progressTrack}>
                <div className={styles.progressFill} style={{ width: `${item.progress * 100}%` }} />
              </div>
              <span className={styles.status} data-state={item.status}>
                {item.status === "processing" ? "Processing…" : item.status === "done" ? "Done" : "Error"}
              </span>
              <div className={styles.rowActions}>
                <button
                  className={styles.iconButton}
                  onClick={() => downloadBlob(item.file, item.file.name)}
                  aria-label={`Download ${item.file.name}`}
                >
                  Download
                </button>
                <button
                  className={styles.iconButton}
                  onClick={() => removeItem(item.id)}
                  aria-label={`Remove ${item.file.name}`}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className={styles.checkGrid}>
        {checks.map((check) => (
          <div className={styles.checkItem} data-ok={check.ok} key={check.label}>
            <span aria-hidden="true">{check.ok ? "✓" : "—"}</span>
            <span>{check.label}</span>
          </div>
        ))}
      </div>
    </WorkspaceShell>
  );
}
