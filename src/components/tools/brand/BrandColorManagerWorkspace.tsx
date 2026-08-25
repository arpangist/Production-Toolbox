import { useState } from "react";
import { useBrandProfile } from "../../../hooks/useBrandProfile";
import { hexToRgb, rgbToHsl } from "../../../lib/colorConvert";
import { nextBrandColorId } from "../../../lib/brand";
import { WorkspaceShell } from "../../workspace/WorkspaceShell";
import type { ToolDefinition } from "../../../types/tool";
import assetStyles from "../assets/MultiFile.module.css";
import paletteStyles from "../image/PaletteWorkspace.module.css";
import imageStyles from "../image/ImageTool.module.css";

export default function BrandColorManagerWorkspace({ tool }: { tool: ToolDefinition }) {
  const { profile, setProfile, loaded } = useBrandProfile();
  const [newName, setNewName] = useState("Primary");
  const [newHex, setNewHex] = useState("#2f5fff");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const addColor = () => {
    setProfile({
      ...profile,
      colors: [...profile.colors, { id: nextBrandColorId(), name: newName || "Color", hex: newHex }],
    });
    setNewName("");
  };

  const removeColor = (id: string) => {
    setProfile({ ...profile, colors: profile.colors.filter((c) => c.id !== id) });
  };

  const copy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId((current) => (current === id ? null : current)), 1500);
  };

  if (!loaded) {
    return (
      <WorkspaceShell title={tool.name}>
        <span className={imageStyles.statusRow}>Loading brand profile…</span>
      </WorkspaceShell>
    );
  }

  return (
    <WorkspaceShell title={tool.name}>
      <div className={imageStyles.field} style={{ maxWidth: 360 }}>
        <span className={imageStyles.fieldLabel}>Brand name</span>
        <input
          className={imageStyles.input}
          value={profile.name}
          onChange={(e) => setProfile({ ...profile, name: e.target.value })}
        />
      </div>

      <div className={imageStyles.row} style={{ marginTop: "var(--space-4)", alignItems: "flex-end" }}>
        <div className={imageStyles.field}>
          <span className={imageStyles.fieldLabel}>Name</span>
          <input className={imageStyles.input} value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Accent" />
        </div>
        <div className={imageStyles.field}>
          <span className={imageStyles.fieldLabel}>Color</span>
          <input type="color" value={newHex} onChange={(e) => setNewHex(e.target.value)} />
        </div>
        <button className={assetStyles.primaryButton} onClick={addColor}>
          Add color
        </button>
      </div>

      <div className={paletteStyles.swatchGrid} style={{ marginTop: "var(--space-5)" }}>
        {profile.colors.map((color) => {
          const [r, g, b] = hexToRgb(color.hex);
          const [h, s, l] = rgbToHsl(r, g, b);
          return (
            <div className={paletteStyles.swatch} key={color.id}>
              <div className={paletteStyles.swatchColor} style={{ background: color.hex }} />
              <div className={paletteStyles.swatchInfo}>
                <span className={paletteStyles.swatchHex}>{color.name}</span>
                <span className={paletteStyles.swatchDetail}>{copiedId === color.id ? "Copied!" : color.hex}</span>
                <span className={paletteStyles.swatchDetail}>
                  rgb({r}, {g}, {b})
                </span>
                <span className={paletteStyles.swatchDetail}>
                  hsl({h}, {s}%, {l}%)
                </span>
                <div className={assetStyles.chipRow} style={{ marginTop: "var(--space-2)" }}>
                  <button className={assetStyles.secondaryButton} onClick={() => copy(color.hex, color.id)}>
                    Copy
                  </button>
                  <button className={assetStyles.secondaryButton} onClick={() => removeColor(color.id)}>
                    Remove
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {profile.colors.length === 0 && (
        <span className={imageStyles.statusRow} style={{ marginTop: "var(--space-4)", display: "block" }}>
          No colors yet — add your brand's primary, secondary, and accent colors above.
        </span>
      )}

      <p className={imageStyles.statusRow} style={{ marginTop: "var(--space-5)" }}>
        Saved locally on this device. Use Token Generator to export these as CSS, JSON, or SCSS.
      </p>
    </WorkspaceShell>
  );
}
