import { useEffect, useRef, useState } from "react";
import { WorkspaceShell } from "../../workspace/WorkspaceShell";
import { downloadBlob } from "../../../lib/downloadFile";
import { LAYOUT_PRESETS, paintLayoutGrid, type LayoutGridConfig } from "../../../lib/layoutGrid";
import type { ToolDefinition } from "../../../types/tool";
import styles from "./GradientWorkspace.module.css";

export default function LayoutGridWorkspace({ tool }: { tool: ToolDefinition }) {
  const [config, setConfig] = useState<LayoutGridConfig>(LAYOUT_PRESETS[0]);
  const [presetLabel, setPresetLabel] = useState(LAYOUT_PRESETS[0].label);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    canvas.width = config.width;
    canvas.height = config.height;
    paintLayoutGrid(ctx, config);
  }, [config]);

  const update = (patch: Partial<LayoutGridConfig>) => {
    setConfig((prev) => ({ ...prev, ...patch }));
    setPresetLabel("");
  };

  const downloadPng = () => {
    canvasRef.current?.toBlob((blob) => {
      if (blob) downloadBlob(blob, "layout-grid.png");
    }, "image/png");
  };

  return (
    <WorkspaceShell title={tool.name}>
      <div className={styles.layout}>
        <div className={styles.settings}>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Presets</span>
            <div className={styles.chipRow}>
              {LAYOUT_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  className={styles.chip}
                  data-active={presetLabel === preset.label}
                  onClick={() => {
                    setConfig(preset);
                    setPresetLabel(preset.label);
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.field}>
            <span className={styles.fieldLabel}>Canvas size</span>
            <div className={styles.sizeRow}>
              <input className={styles.input} type="number" value={config.width} onChange={(e) => update({ width: Number(e.target.value) })} />
              <span aria-hidden="true">×</span>
              <input className={styles.input} type="number" value={config.height} onChange={(e) => update({ height: Number(e.target.value) })} />
            </div>
          </div>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Columns — {config.columns}</span>
            <input className={styles.slider} type="range" min={1} max={16} value={config.columns} onChange={(e) => update({ columns: Number(e.target.value) })} />
          </div>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Gutter — {config.gutter}px</span>
            <input className={styles.slider} type="range" min={0} max={64} value={config.gutter} onChange={(e) => update({ gutter: Number(e.target.value) })} />
          </div>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Margin — {config.margin}px</span>
            <input className={styles.slider} type="range" min={0} max={120} value={config.margin} onChange={(e) => update({ margin: Number(e.target.value) })} />
          </div>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Rows — {config.rows || "off"}</span>
            <input className={styles.slider} type="range" min={0} max={12} value={config.rows} onChange={(e) => update({ rows: Number(e.target.value) })} />
          </div>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Baseline — {config.baseline ? `${config.baseline}px` : "off"}</span>
            <input
              className={styles.slider}
              type="range"
              min={0}
              max={48}
              value={config.baseline}
              onChange={(e) => update({ baseline: Number(e.target.value) })}
            />
          </div>
        </div>

        <div>
          <canvas ref={canvasRef} style={{ width: "100%", height: "auto", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)" }} />
          <div className={styles.actions}>
            <button className={styles.actionButton} onClick={downloadPng}>
              Download PNG
            </button>
          </div>
        </div>
      </div>
    </WorkspaceShell>
  );
}
