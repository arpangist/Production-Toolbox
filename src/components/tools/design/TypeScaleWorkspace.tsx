import { useMemo, useState } from "react";
import { WorkspaceShell } from "../../workspace/WorkspaceShell";
import { downloadBlob } from "../../../lib/downloadFile";
import { computeScale, scaleToCss, scaleToJson, scaleToText, SCALE_RATIOS } from "../../../lib/typeScale";
import type { ToolDefinition } from "../../../types/tool";
import gradientStyles from "./GradientWorkspace.module.css";
import styles from "./TypeScaleWorkspace.module.css";

export default function TypeScaleWorkspace({ tool }: { tool: ToolDefinition }) {
  const [basePx, setBasePx] = useState(16);
  const [ratio, setRatio] = useState(SCALE_RATIOS[3].value);
  const [copied, setCopied] = useState<string | null>(null);

  const steps = useMemo(() => computeScale(basePx, ratio), [basePx, ratio]);

  const copy = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied((current) => (current === label ? null : current)), 1500);
  };

  const downloadImage = () => {
    const canvas = document.createElement("canvas");
    const padding = 40;
    const lineHeights = steps.map((s) => Math.ceil(s.sizePx * 1.3) + 16);
    canvas.width = 800;
    canvas.height = lineHeights.reduce((a, b) => a + b, 0) + padding * 2;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#111111";
    ctx.textBaseline = "top";
    let y = padding;
    steps.forEach((step, i) => {
      ctx.font = `700 ${step.sizePx}px sans-serif`;
      ctx.fillText(`${step.label} — ${step.sizePx.toFixed(0)}px`, padding, y);
      y += lineHeights[i];
    });
    canvas.toBlob((blob) => {
      if (blob) downloadBlob(blob, "type-scale.png");
    }, "image/png");
  };

  return (
    <WorkspaceShell title={tool.name}>
      <div className={gradientStyles.layout}>
        <div className={gradientStyles.settings}>
          <div className={gradientStyles.field}>
            <span className={gradientStyles.fieldLabel}>Base size — {basePx}px</span>
            <input
              className={gradientStyles.slider}
              type="range"
              min={10}
              max={32}
              value={basePx}
              onChange={(e) => setBasePx(Number(e.target.value))}
            />
          </div>

          <div className={gradientStyles.field}>
            <span className={gradientStyles.fieldLabel}>Ratio</span>
            <div className={gradientStyles.chipRow}>
              {SCALE_RATIOS.map((option) => (
                <button
                  key={option.label}
                  className={gradientStyles.chip}
                  data-active={ratio === option.value}
                  onClick={() => setRatio(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className={gradientStyles.sizeRow} style={{ marginTop: "var(--space-2)" }}>
              <span className={gradientStyles.fieldLabel}>Custom</span>
              <input
                className={gradientStyles.input}
                type="number"
                step="0.001"
                value={ratio}
                onChange={(e) => setRatio(Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        <div>
          <div className={styles.preview}>
            {steps.map((step) => (
              <div className={styles.row} key={step.label}>
                <span className={styles.label}>{step.label}</span>
                <span className={styles.sample} style={{ fontSize: step.sizePx }}>
                  Aa
                </span>
                <span className={styles.sizeValue}>{step.sizePx.toFixed(1)}px</span>
              </div>
            ))}
          </div>
          <div className={gradientStyles.actions}>
            <button className={gradientStyles.actionButton} onClick={() => copy(scaleToCss(steps), "css")}>
              {copied === "css" ? "Copied!" : "Copy CSS"}
            </button>
            <button className={gradientStyles.actionButton} onClick={() => copy(scaleToJson(steps), "json")}>
              {copied === "json" ? "Copied!" : "Copy JSON"}
            </button>
            <button className={gradientStyles.actionButton} onClick={() => copy(scaleToText(steps), "text")}>
              {copied === "text" ? "Copied!" : "Copy Text"}
            </button>
            <button className={gradientStyles.actionButton} onClick={downloadImage}>
              Download Image
            </button>
          </div>
        </div>
      </div>
    </WorkspaceShell>
  );
}
