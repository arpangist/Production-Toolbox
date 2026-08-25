import { useMemo, useState } from "react";
import { WorkspaceShell } from "../../workspace/WorkspaceShell";
import { downloadBlob } from "../../../lib/downloadFile";
import { nextStopId, paintGradient, toCss, toSvg, type GradientConfig, type GradientType } from "../../../lib/gradient";
import type { ToolDefinition } from "../../../types/tool";
import styles from "./GradientWorkspace.module.css";

const TYPES: { key: GradientType; label: string }[] = [
  { key: "linear", label: "Linear" },
  { key: "radial", label: "Radial" },
  { key: "conic", label: "Conic" },
];

export default function GradientWorkspace({ tool }: { tool: ToolDefinition }) {
  const [config, setConfig] = useState<GradientConfig>({
    type: "linear",
    angle: 90,
    centerX: 50,
    centerY: 50,
    stops: [
      { id: nextStopId(), color: "#2f5fff", position: 0 },
      { id: nextStopId(), color: "#ff6b6b", position: 100 },
    ],
  });
  const [exportWidth, setExportWidth] = useState(1200);
  const [exportHeight, setExportHeight] = useState(800);
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);

  const css = useMemo(() => toCss(config), [config]);

  const updateStop = (id: string, patch: Partial<{ color: string; position: number }>) => {
    setConfig((prev) => ({
      ...prev,
      stops: prev.stops.map((stop) => (stop.id === id ? { ...stop, ...patch } : stop)),
    }));
  };

  const addStop = () => {
    setConfig((prev) => ({
      ...prev,
      stops: [...prev.stops, { id: nextStopId(), color: "#ffffff", position: 50 }],
    }));
  };

  const removeStop = (id: string) => {
    setConfig((prev) => (prev.stops.length <= 2 ? prev : { ...prev, stops: prev.stops.filter((s) => s.id !== id) }));
  };

  const copy = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedLabel(label);
    setTimeout(() => setCopiedLabel((current) => (current === label ? null : current)), 1500);
  };

  const downloadPng = () => {
    const canvas = document.createElement("canvas");
    canvas.width = exportWidth;
    canvas.height = exportHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    paintGradient(ctx, config, exportWidth, exportHeight);
    canvas.toBlob((blob) => {
      if (blob) downloadBlob(blob, "gradient.png");
    }, "image/png");
  };

  const downloadSvg = () => {
    const svg = toSvg(config, exportWidth, exportHeight);
    downloadBlob(new Blob([svg], { type: "image/svg+xml" }), "gradient.svg");
  };

  return (
    <WorkspaceShell title={tool.name}>
      <div className={styles.layout}>
        <div className={styles.settings}>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Type</span>
            <div className={styles.chipRow}>
              {TYPES.map((option) => (
                <button
                  key={option.key}
                  className={styles.chip}
                  data-active={config.type === option.key}
                  onClick={() => setConfig((prev) => ({ ...prev, type: option.key }))}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {(config.type === "linear" || config.type === "conic") && (
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Angle — {config.angle}°</span>
              <input
                className={styles.slider}
                type="range"
                min={0}
                max={360}
                value={config.angle}
                onChange={(e) => setConfig((prev) => ({ ...prev, angle: Number(e.target.value) }))}
                aria-label="Angle"
              />
            </div>
          )}

          {(config.type === "radial" || config.type === "conic") && (
            <>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Center X — {config.centerX}%</span>
                <input
                  className={styles.slider}
                  type="range"
                  min={0}
                  max={100}
                  value={config.centerX}
                  onChange={(e) => setConfig((prev) => ({ ...prev, centerX: Number(e.target.value) }))}
                  aria-label="Center X"
                />
              </div>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Center Y — {config.centerY}%</span>
                <input
                  className={styles.slider}
                  type="range"
                  min={0}
                  max={100}
                  value={config.centerY}
                  onChange={(e) => setConfig((prev) => ({ ...prev, centerY: Number(e.target.value) }))}
                  aria-label="Center Y"
                />
              </div>
            </>
          )}

          <div className={styles.field}>
            <span className={styles.fieldLabel}>Stops</span>
            {config.stops.map((stop) => (
              <div className={styles.stopRow} key={stop.id}>
                <input
                  className={styles.colorInput}
                  type="color"
                  value={stop.color}
                  onChange={(e) => updateStop(stop.id, { color: e.target.value })}
                  aria-label="Stop color"
                />
                <input
                  className={styles.positionSlider}
                  type="range"
                  min={0}
                  max={100}
                  value={stop.position}
                  onChange={(e) => updateStop(stop.id, { position: Number(e.target.value) })}
                  aria-label="Stop position"
                />
                <span className={styles.positionValue}>{stop.position}%</span>
                <button
                  className={styles.removeStop}
                  onClick={() => removeStop(stop.id)}
                  disabled={config.stops.length <= 2}
                  aria-label="Remove stop"
                >
                  ×
                </button>
              </div>
            ))}
            <button className={styles.addStop} onClick={addStop}>
              + Add stop
            </button>
          </div>

          <div className={styles.field}>
            <span className={styles.fieldLabel}>Export size</span>
            <div className={styles.sizeRow}>
              <input
                className={styles.input}
                type="number"
                min={1}
                value={exportWidth}
                aria-label="Export width"
                onChange={(e) => setExportWidth(Number(e.target.value))}
              />
              <span aria-hidden="true">×</span>
              <input
                className={styles.input}
                type="number"
                min={1}
                value={exportHeight}
                aria-label="Export height"
                onChange={(e) => setExportHeight(Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        <div>
          <div className={styles.preview} style={{ background: css }} role="img" aria-label="Gradient preview" />
          <div className={styles.actions}>
            <button className={styles.actionButton} onClick={() => copy(css, "css")}>
              {copiedLabel === "css" ? "Copied!" : "Copy CSS"}
            </button>
            <button className={styles.actionButton} onClick={() => copy(toSvg(config, exportWidth, exportHeight), "svg")}>
              {copiedLabel === "svg" ? "Copied!" : "Copy SVG"}
            </button>
            <button className={styles.actionButton} onClick={downloadSvg}>
              Download SVG
            </button>
            <button className={styles.actionButton} onClick={downloadPng}>
              Download PNG
            </button>
          </div>
        </div>
      </div>
    </WorkspaceShell>
  );
}
