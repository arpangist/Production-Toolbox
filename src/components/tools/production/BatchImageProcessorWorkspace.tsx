import { useRef, useState } from "react";
import { useFileImport } from "../../../hooks/useFileImport";
import { WorkerPool } from "../../../workers/workerPool";
import { runPipelineForFile, type PipelineConfig, type PipelineOutput, type StepKey } from "../../../lib/batchImagePipeline";
import { downloadAsZip } from "../../../lib/zipExport";
import { formatBytes } from "../../../lib/format";
import { FORMAT_LABELS, supportsQuality } from "../../../lib/imageFormat";
import { MultiFileStage } from "../assets/MultiFileStage";
import { WorkspaceShell } from "../../workspace/WorkspaceShell";
import type { ImageFormat } from "../../../workers/imageProcessing.types";
import type { ToolDefinition } from "../../../types/tool";
import assetStyles from "../assets/MultiFile.module.css";
import imageStyles from "../image/ImageTool.module.css";

const STEP_LABELS: Record<StepKey, string> = { resize: "Resize", format: "Compress / Convert", rename: "Rename" };

export default function BatchImageProcessorWorkspace({ tool }: { tool: ToolDefinition }) {
  const { files, error, importFiles, reset } = useFileImport({ acceptedTypes: ["image/*"], multiple: true });

  const [order, setOrder] = useState<StepKey[]>(["resize", "format", "rename"]);
  const [resize, setResize] = useState({ enabled: true, width: 1920, height: 1080, mode: "fit" as "fit" | "fill" });
  const [format, setFormat] = useState({ enabled: true, format: "image/jpeg" as ImageFormat, quality: 85 });
  const [rename, setRename] = useState({ enabled: false, project: "project", client: "client", pattern: "{project}_{client}_{number}", numberStart: 1, numberPadding: 3 });

  const [results, setResults] = useState<PipelineOutput[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processError, setProcessError] = useState<string | null>(null);
  const poolRef = useRef<WorkerPool | null>(null);

  const getPool = () => {
    if (!poolRef.current) {
      poolRef.current = new WorkerPool(() => new Worker(new URL("../../../workers/imageProcessing.worker.ts", import.meta.url), { type: "module" }));
    }
    return poolRef.current;
  };

  const moveStep = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= order.length) return;
    const next = [...order];
    [next[index], next[target]] = [next[target], next[index]];
    setOrder(next);
  };

  const runPipeline = async () => {
    if (files.length === 0) return;
    setProcessing(true);
    setProcessError(null);
    setProgress(0);
    setResults([]);

    const config: PipelineConfig = {
      order,
      resize,
      format,
      rename: {
        enabled: rename.enabled,
        fields: {
          project: rename.project,
          client: rename.client,
          date: new Date().toISOString().slice(0, 10),
          pattern: rename.pattern,
          numberStart: rename.numberStart,
          numberPadding: rename.numberPadding,
        },
      },
    };

    try {
      const pool = getPool();
      const outputs: PipelineOutput[] = [];
      for (let i = 0; i < files.length; i++) {
        outputs.push(await runPipelineForFile(pool, files[i], config, i));
        setProgress((i + 1) / files.length);
      }
      setResults(outputs);
    } catch (err) {
      setProcessError(err instanceof Error ? err.message : "Batch processing failed.");
    } finally {
      setProcessing(false);
    }
  };

  const handleDownloadZip = async () => {
    if (results.length === 0) return;
    const entries = await Promise.all(
      results.map(async (r) => ({ name: r.name, data: new Uint8Array(await r.blob.arrayBuffer()) })),
    );
    await downloadAsZip(entries, "batch-processed.zip");
  };

  const handleClear = () => {
    reset();
    setResults([]);
  };

  return (
    <WorkspaceShell title={tool.name}>
      <MultiFileStage files={files} error={error} accept="image/*" dropLabel="Import images to process" onFiles={importFiles} onClear={handleClear}>
        <div className={imageStyles.field} style={{ marginBottom: "var(--space-4)" }}>
          <span className={imageStyles.fieldLabel}>Pipeline order</span>
          <div className={assetStyles.chipRow}>
            {order.map((key, index) => (
              <span key={key} className={assetStyles.chip} data-active={key === "resize" ? resize.enabled : key === "format" ? format.enabled : rename.enabled}>
                {index + 1}. {STEP_LABELS[key]}
                <button style={{ marginLeft: 6 }} onClick={() => moveStep(index, -1)} disabled={index === 0} aria-label="Move earlier">
                  ↑
                </button>
                <button style={{ marginLeft: 2 }} onClick={() => moveStep(index, 1)} disabled={index === order.length - 1} aria-label="Move later">
                  ↓
                </button>
              </span>
            ))}
          </div>
        </div>

        <div className={assetStyles.group} style={{ marginBottom: "var(--space-3)" }}>
          <label className={imageStyles.checkboxRow}>
            <input type="checkbox" checked={resize.enabled} onChange={(e) => setResize({ ...resize, enabled: e.target.checked })} />
            <strong>Resize</strong>
          </label>
          {resize.enabled && (
            <div className={imageStyles.row} style={{ flexWrap: "wrap", gap: "var(--space-3)" }}>
              <input className={imageStyles.input} type="number" value={resize.width} onChange={(e) => setResize({ ...resize, width: Number(e.target.value) })} style={{ width: 100 }} />
              <span aria-hidden="true">×</span>
              <input className={imageStyles.input} type="number" value={resize.height} onChange={(e) => setResize({ ...resize, height: Number(e.target.value) })} style={{ width: 100 }} />
              <select className={imageStyles.select} value={resize.mode} onChange={(e) => setResize({ ...resize, mode: e.target.value as "fit" | "fill" })} style={{ width: 160 }}>
                <option value="fit">Fit within (no crop)</option>
                <option value="fill">Fill exactly (crop)</option>
              </select>
            </div>
          )}
        </div>

        <div className={assetStyles.group} style={{ marginBottom: "var(--space-3)" }}>
          <label className={imageStyles.checkboxRow}>
            <input type="checkbox" checked={format.enabled} onChange={(e) => setFormat({ ...format, enabled: e.target.checked })} />
            <strong>Compress / Convert</strong>
          </label>
          {format.enabled && (
            <div className={imageStyles.row} style={{ flexWrap: "wrap", gap: "var(--space-3)" }}>
              <select className={imageStyles.select} value={format.format} onChange={(e) => setFormat({ ...format, format: e.target.value as ImageFormat })} style={{ width: 140 }}>
                {(["image/jpeg", "image/png", "image/webp"] as ImageFormat[]).map((f) => (
                  <option key={f} value={f}>
                    {FORMAT_LABELS[f]}
                  </option>
                ))}
              </select>
              {supportsQuality(format.format) && (
                <div className={imageStyles.field} style={{ flex: 1, minWidth: 160 }}>
                  <span className={imageStyles.fieldLabel}>Quality — {format.quality}%</span>
                  <input className={imageStyles.slider} type="range" min={1} max={100} value={format.quality} onChange={(e) => setFormat({ ...format, quality: Number(e.target.value) })} />
                </div>
              )}
            </div>
          )}
        </div>

        <div className={assetStyles.group} style={{ marginBottom: "var(--space-4)" }}>
          <label className={imageStyles.checkboxRow}>
            <input type="checkbox" checked={rename.enabled} onChange={(e) => setRename({ ...rename, enabled: e.target.checked })} />
            <strong>Rename</strong>
          </label>
          {rename.enabled && (
            <div className={imageStyles.row} style={{ flexWrap: "wrap", gap: "var(--space-3)" }}>
              <input className={imageStyles.input} value={rename.project} onChange={(e) => setRename({ ...rename, project: e.target.value })} placeholder="Project" style={{ width: 120 }} />
              <input className={imageStyles.input} value={rename.client} onChange={(e) => setRename({ ...rename, client: e.target.value })} placeholder="Client" style={{ width: 120 }} />
              <input className={imageStyles.input} value={rename.pattern} onChange={(e) => setRename({ ...rename, pattern: e.target.value })} style={{ width: 220 }} />
            </div>
          )}
        </div>

        <button className={assetStyles.primaryButton} onClick={runPipeline} disabled={files.length === 0 || processing}>
          {processing ? `Processing… ${Math.round(progress * 100)}%` : `Run pipeline on ${files.length} image${files.length === 1 ? "" : "s"}`}
        </button>
        {processError && <p className={assetStyles.errorText}>{processError}</p>}

        {results.length > 0 && (
          <div className={assetStyles.grid} style={{ marginTop: "var(--space-4)" }}>
            {results.map((r, i) => (
              <div className={assetStyles.card} key={i}>
                <div className={assetStyles.cardInfo}>
                  <span className={assetStyles.cardName}>{r.name}</span>
                  <span className={assetStyles.cardDetail}>
                    {formatBytes(r.originalFile.size)} → {formatBytes(r.blob.size)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className={assetStyles.footer}>
          <span className={assetStyles.statusRow}>{results.length > 0 ? `${results.length} files ready` : ""}</span>
          <button className={assetStyles.primaryButton} disabled={results.length === 0} onClick={handleDownloadZip}>
            Download ZIP
          </button>
        </div>
      </MultiFileStage>
    </WorkspaceShell>
  );
}
