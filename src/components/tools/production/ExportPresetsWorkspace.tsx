import { useState } from "react";
import { useExportPresets } from "../../../hooks/useExportPresets";
import { nextPresetId, type ExportPreset } from "../../../lib/exportPresets";
import { WorkspaceShell } from "../../workspace/WorkspaceShell";
import type { ToolDefinition } from "../../../types/tool";
import imageStyles from "../image/ImageTool.module.css";
import assetStyles from "../assets/MultiFile.module.css";

const EMPTY_DRAFT: Omit<ExportPreset, "id"> = { name: "", width: 1080, height: 1920, fps: 30, format: "MP4 / WebM", notes: "" };

export default function ExportPresetsWorkspace({ tool }: { tool: ToolDefinition }) {
  const { presets, setPresets, loaded } = useExportPresets();
  const [draft, setDraft] = useState(EMPTY_DRAFT);

  const addPreset = () => {
    if (!draft.name.trim()) return;
    setPresets([...presets, { id: nextPresetId(), ...draft }]);
    setDraft(EMPTY_DRAFT);
  };

  const removePreset = (id: string) => {
    setPresets(presets.filter((p) => p.id !== id));
  };

  if (!loaded) {
    return (
      <WorkspaceShell title={tool.name}>
        <span className={imageStyles.statusRow}>Loading presets…</span>
      </WorkspaceShell>
    );
  }

  return (
    <WorkspaceShell title={tool.name}>
      <div className={assetStyles.group} style={{ marginBottom: "var(--space-5)" }}>
        <span className={assetStyles.groupTitle}>New preset</span>
        <div className={imageStyles.row} style={{ flexWrap: "wrap", gap: "var(--space-3)" }}>
          <input className={imageStyles.input} placeholder="Name (e.g. Client Social Reel)" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} style={{ width: 220 }} />
          <input className={imageStyles.input} type="number" value={draft.width} onChange={(e) => setDraft({ ...draft, width: Number(e.target.value) })} style={{ width: 90 }} aria-label="Width" />
          <span aria-hidden="true">×</span>
          <input className={imageStyles.input} type="number" value={draft.height} onChange={(e) => setDraft({ ...draft, height: Number(e.target.value) })} style={{ width: 90 }} aria-label="Height" />
          <input className={imageStyles.input} type="number" value={draft.fps} onChange={(e) => setDraft({ ...draft, fps: Number(e.target.value) })} style={{ width: 80 }} aria-label="FPS" placeholder="FPS" />
          <input className={imageStyles.input} value={draft.format} onChange={(e) => setDraft({ ...draft, format: e.target.value })} style={{ width: 160 }} placeholder="Format" />
        </div>
        <input className={imageStyles.input} value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} placeholder="Notes (optional)" />
        <button className={assetStyles.primaryButton} onClick={addPreset} style={{ alignSelf: "flex-start" }}>
          Save preset
        </button>
      </div>

      <div className={assetStyles.grid}>
        {presets.map((preset) => (
          <div className={assetStyles.card} key={preset.id}>
            <div className={assetStyles.cardInfo}>
              <span className={assetStyles.cardName}>{preset.name}</span>
              <span className={`${assetStyles.cardDetail} mono`}>
                {preset.width}×{preset.height}
                {preset.fps > 0 ? ` · ${preset.fps} FPS` : ""}
              </span>
              <span className={assetStyles.cardDetail}>{preset.format}</span>
              {preset.notes && <span className={assetStyles.cardDetail}>{preset.notes}</span>}
              <button className={assetStyles.secondaryButton} onClick={() => removePreset(preset.id)} style={{ marginTop: "var(--space-2)" }}>
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      {presets.length === 0 && <span className={imageStyles.statusRow}>No presets saved yet — create one above.</span>}
    </WorkspaceShell>
  );
}
