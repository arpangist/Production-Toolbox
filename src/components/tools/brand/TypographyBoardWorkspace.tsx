import { useState } from "react";
import { WorkspaceShell } from "../../workspace/WorkspaceShell";
import type { ToolDefinition } from "../../../types/tool";
import imageStyles from "../image/ImageTool.module.css";
import assetStyles from "../assets/MultiFile.module.css";
import styles from "./TypographyBoardWorkspace.module.css";

interface Combo {
  id: string;
  headline: string;
  body: string;
  caption: string;
}

let idCounter = 0;
function nextId(): string {
  idCounter += 1;
  return `combo-${idCounter}`;
}

const DEFAULT_COMBOS: Combo[] = [
  { id: nextId(), headline: "Georgia, serif", body: "Georgia, serif", caption: "Georgia, serif" },
  { id: nextId(), headline: "'Helvetica Neue', Arial, sans-serif", body: "'Helvetica Neue', Arial, sans-serif", caption: "'Helvetica Neue', Arial, sans-serif" },
];

export default function TypographyBoardWorkspace({ tool }: { tool: ToolDefinition }) {
  const [combos, setCombos] = useState<Combo[]>(DEFAULT_COMBOS);
  const [headlineText, setHeadlineText] = useState("The quick brown fox");
  const [bodyText, setBodyText] = useState("The quick brown fox jumps over the lazy dog, testing every letterform in the alphabet.");
  const [captionText, setCaptionText] = useState("Caption · Small print · 2026");

  const update = (id: string, patch: Partial<Combo>) => {
    setCombos((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  const addCombo = () => {
    setCombos((prev) => [...prev, { id: nextId(), headline: "sans-serif", body: "sans-serif", caption: "sans-serif" }]);
  };

  const removeCombo = (id: string) => {
    setCombos((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <WorkspaceShell title={tool.name}>
      <div className={imageStyles.row} style={{ flexWrap: "wrap", gap: "var(--space-4)", marginBottom: "var(--space-5)" }}>
        <div className={imageStyles.field} style={{ flex: 1, minWidth: 200 }}>
          <span className={imageStyles.fieldLabel}>Headline text</span>
          <input className={imageStyles.input} value={headlineText} onChange={(e) => setHeadlineText(e.target.value)} />
        </div>
        <div className={imageStyles.field} style={{ flex: 1, minWidth: 200 }}>
          <span className={imageStyles.fieldLabel}>Body text</span>
          <input className={imageStyles.input} value={bodyText} onChange={(e) => setBodyText(e.target.value)} />
        </div>
        <div className={imageStyles.field} style={{ flex: 1, minWidth: 200 }}>
          <span className={imageStyles.fieldLabel}>Caption text</span>
          <input className={imageStyles.input} value={captionText} onChange={(e) => setCaptionText(e.target.value)} />
        </div>
      </div>

      <button className={assetStyles.secondaryButton} onClick={addCombo} style={{ marginBottom: "var(--space-4)" }}>
        + Add combination
      </button>

      <div className={styles.board}>
        {combos.map((combo) => (
          <div className={styles.card} key={combo.id}>
            <button className={styles.removeButton} onClick={() => removeCombo(combo.id)} aria-label="Remove combination">
              ×
            </button>
            <div className={styles.fieldRow}>
              <span className={styles.fieldLabel}>Headline font-family</span>
              <input className={styles.fontInput} value={combo.headline} onChange={(e) => update(combo.id, { headline: e.target.value })} />
            </div>
            <div className={styles.headline} style={{ fontFamily: combo.headline }}>
              {headlineText}
            </div>

            <div className={styles.fieldRow}>
              <span className={styles.fieldLabel}>Body font-family</span>
              <input className={styles.fontInput} value={combo.body} onChange={(e) => update(combo.id, { body: e.target.value })} />
            </div>
            <div className={styles.body} style={{ fontFamily: combo.body }}>
              {bodyText}
            </div>

            <div className={styles.fieldRow}>
              <span className={styles.fieldLabel}>Caption font-family</span>
              <input className={styles.fontInput} value={combo.caption} onChange={(e) => update(combo.id, { caption: e.target.value })} />
            </div>
            <div className={styles.caption} style={{ fontFamily: combo.caption }}>
              {captionText}
            </div>
          </div>
        ))}
      </div>
    </WorkspaceShell>
  );
}
