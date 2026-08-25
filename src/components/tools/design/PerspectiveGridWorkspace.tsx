import { useEffect, useRef, useState } from "react";
import { WorkspaceShell } from "../../workspace/WorkspaceShell";
import { downloadBlob } from "../../../lib/downloadFile";
import { paintPerspectiveGrid, perspectiveGridToSvg, type PerspectiveConfig, type PerspectiveType } from "../../../lib/perspectiveGrid";
import type { ToolDefinition } from "../../../types/tool";
import styles from "./GradientWorkspace.module.css";

const TYPES: { key: PerspectiveType; label: string }[] = [
  { key: "1-point", label: "1-Point" },
  { key: "2-point", label: "2-Point" },
  { key: "3-point", label: "3-Point" },
];

export default function PerspectiveGridWorkspace({ tool }: { tool: ToolDefinition }) {
  const [config, setConfig] = useState<PerspectiveConfig>({
    type: "2-point",
    vp1: { x: -10, y: 50 },
    vp2: { x: 110, y: 50 },
    vp3: { x: 50, y: -20 },
    density: 24,
    lineOpacity: 40,
  });
  const [width, setWidth] = useState(1000);
  const [height, setHeight] = useState(700);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    canvas.width = width;
    canvas.height = height;
    paintPerspectiveGrid(ctx, config, width, height);
  }, [config, width, height]);

  const copySvg = async () => {
    await navigator.clipboard.writeText(perspectiveGridToSvg(config, width, height));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const downloadSvg = () => {
    downloadBlob(new Blob([perspectiveGridToSvg(config, width, height)], { type: "image/svg+xml" }), "perspective-grid.svg");
  };

  const downloadPng = () => {
    canvasRef.current?.toBlob((blob) => {
      if (blob) downloadBlob(blob, "perspective-grid.png");
    }, "image/png");
  };

  const updateVp = (key: "vp1" | "vp2" | "vp3", axis: "x" | "y", value: number) => {
    setConfig((prev) => ({ ...prev, [key]: { ...prev[key], [axis]: value } }));
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

          {(["vp1", "vp2", "vp3"] as const)
            .slice(0, config.type === "1-point" ? 1 : config.type === "2-point" ? 2 : 3)
            .map((key, index) => (
              <div key={key} className={styles.field}>
                <span className={styles.fieldLabel}>
                  Vanishing point {index + 1} — {config[key].x}%, {config[key].y}%
                </span>
                <input
                  className={styles.slider}
                  type="range"
                  min={-50}
                  max={150}
                  value={config[key].x}
                  onChange={(e) => updateVp(key, "x", Number(e.target.value))}
                  aria-label={`VP${index + 1} X`}
                />
                <input
                  className={styles.slider}
                  type="range"
                  min={-50}
                  max={150}
                  value={config[key].y}
                  onChange={(e) => updateVp(key, "y", Number(e.target.value))}
                  aria-label={`VP${index + 1} Y`}
                />
              </div>
            ))}

          <div className={styles.field}>
            <span className={styles.fieldLabel}>Line density — {config.density}</span>
            <input
              className={styles.slider}
              type="range"
              min={6}
              max={48}
              value={config.density}
              onChange={(e) => setConfig((prev) => ({ ...prev, density: Number(e.target.value) }))}
            />
          </div>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Line opacity — {config.lineOpacity}%</span>
            <input
              className={styles.slider}
              type="range"
              min={5}
              max={100}
              value={config.lineOpacity}
              onChange={(e) => setConfig((prev) => ({ ...prev, lineOpacity: Number(e.target.value) }))}
            />
          </div>

          <div className={styles.field}>
            <span className={styles.fieldLabel}>Canvas size</span>
            <div className={styles.sizeRow}>
              <input className={styles.input} type="number" value={width} onChange={(e) => setWidth(Number(e.target.value))} />
              <span aria-hidden="true">×</span>
              <input className={styles.input} type="number" value={height} onChange={(e) => setHeight(Number(e.target.value))} />
            </div>
          </div>
        </div>

        <div>
          <canvas ref={canvasRef} style={{ width: "100%", height: "auto", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)" }} />
          <div className={styles.actions}>
            <button className={styles.actionButton} onClick={copySvg}>
              {copied ? "Copied!" : "Copy SVG"}
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
