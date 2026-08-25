import { useState } from "react";
import { useBrandProfile } from "../../../hooks/useBrandProfile";
import { EMPTY_TOKEN_SET, nextTokenId, tokensToCss, tokensToJson, tokensToScss, type Token, type TokenSet } from "../../../lib/designTokens";
import { downloadBlob } from "../../../lib/downloadFile";
import { WorkspaceShell } from "../../workspace/WorkspaceShell";
import type { ToolDefinition } from "../../../types/tool";
import imageStyles from "../image/ImageTool.module.css";
import assetStyles from "../assets/MultiFile.module.css";
import styles from "./TokenGeneratorWorkspace.module.css";

const SECTIONS: { key: keyof TokenSet; label: string; placeholder: string; isColor?: boolean }[] = [
  { key: "colors", label: "Colors", placeholder: "#2f5fff", isColor: true },
  { key: "spacing", label: "Spacing", placeholder: "16px" },
  { key: "radius", label: "Radius", placeholder: "8px" },
  { key: "shadows", label: "Shadows", placeholder: "0 2px 8px rgba(17,17,17,0.12)" },
];

export default function TokenGeneratorWorkspace({ tool }: { tool: ToolDefinition }) {
  const { profile } = useBrandProfile();
  const [tokens, setTokens] = useState<TokenSet>(EMPTY_TOKEN_SET);
  const [drafts, setDrafts] = useState<Record<keyof TokenSet, { name: string; value: string }>>({
    colors: { name: "", value: "#2f5fff" },
    spacing: { name: "", value: "" },
    radius: { name: "", value: "" },
    shadows: { name: "", value: "" },
  });
  const [copied, setCopied] = useState<string | null>(null);

  const addToken = (category: keyof TokenSet) => {
    const draft = drafts[category];
    if (!draft.name.trim() || !draft.value.trim()) return;
    const token: Token = { id: nextTokenId(), name: draft.name.trim(), value: draft.value.trim() };
    setTokens((prev) => ({ ...prev, [category]: [...prev[category], token] }));
    setDrafts((prev) => ({ ...prev, [category]: { name: "", value: category === "colors" ? "#2f5fff" : "" } }));
  };

  const removeToken = (category: keyof TokenSet, id: string) => {
    setTokens((prev) => ({ ...prev, [category]: prev[category].filter((t) => t.id !== id) }));
  };

  const loadBrandColors = () => {
    const imported: Token[] = profile.colors.map((c) => ({ id: nextTokenId(), name: c.name, value: c.hex }));
    setTokens((prev) => ({ ...prev, colors: [...prev.colors, ...imported] }));
  };

  const copy = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied((current) => (current === label ? null : current)), 1500);
  };

  const downloadCss = () => {
    downloadBlob(new Blob([tokensToCss(tokens)], { type: "text/css" }), "tokens.css");
  };

  return (
    <WorkspaceShell title={tool.name}>
      <button className={assetStyles.secondaryButton} onClick={loadBrandColors} disabled={profile.colors.length === 0} style={{ marginBottom: "var(--space-4)" }}>
        Load from Brand Colors ({profile.colors.length})
      </button>

      {SECTIONS.map((section) => (
        <div className={styles.section} key={section.key}>
          <span className={styles.sectionTitle}>{section.label}</span>
          {tokens[section.key].map((token) => (
            <div className={styles.tokenRow} key={token.id}>
              {section.isColor && <span className={styles.swatch} style={{ background: token.value }} />}
              <span className={styles.name}>{token.name}</span>
              <span className={`${styles.value} mono`}>{token.value}</span>
              <button className={assetStyles.secondaryButton} onClick={() => removeToken(section.key, token.id)}>
                Remove
              </button>
            </div>
          ))}
          <div className={styles.addRow}>
            <input
              className={imageStyles.input}
              placeholder="Name"
              value={drafts[section.key].name}
              onChange={(e) => setDrafts((prev) => ({ ...prev, [section.key]: { ...prev[section.key], name: e.target.value } }))}
              style={{ width: 140 }}
            />
            {section.isColor ? (
              <input
                type="color"
                value={drafts[section.key].value || "#2f5fff"}
                onChange={(e) => setDrafts((prev) => ({ ...prev, [section.key]: { ...prev[section.key], value: e.target.value } }))}
              />
            ) : (
              <input
                className={imageStyles.input}
                placeholder={section.placeholder}
                value={drafts[section.key].value}
                onChange={(e) => setDrafts((prev) => ({ ...prev, [section.key]: { ...prev[section.key], value: e.target.value } }))}
              />
            )}
            <button className={assetStyles.secondaryButton} onClick={() => addToken(section.key)}>
              Add
            </button>
          </div>
        </div>
      ))}

      <div className={assetStyles.footer}>
        <span className={assetStyles.statusRow}>
          {Object.values(tokens).reduce((sum, arr) => sum + arr.length, 0)} tokens defined
        </span>
        <div className={imageStyles.row}>
          <button className={assetStyles.secondaryButton} onClick={() => copy(tokensToCss(tokens), "css")}>
            {copied === "css" ? "Copied!" : "Copy CSS"}
          </button>
          <button className={assetStyles.secondaryButton} onClick={() => copy(tokensToScss(tokens), "scss")}>
            {copied === "scss" ? "Copied!" : "Copy SCSS"}
          </button>
          <button className={assetStyles.secondaryButton} onClick={() => copy(tokensToJson(tokens), "json")}>
            {copied === "json" ? "Copied!" : "Copy JSON"}
          </button>
          <button className={assetStyles.primaryButton} onClick={downloadCss}>
            Download CSS
          </button>
        </div>
      </div>
    </WorkspaceShell>
  );
}
