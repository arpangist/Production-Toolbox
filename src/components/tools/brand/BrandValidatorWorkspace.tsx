import { useEffect, useState } from "react";
import { useFileImport } from "../../../hooks/useFileImport";
import { useImageProcessor } from "../../../hooks/useImageProcessor";
import { useImageDimensions } from "../../../hooks/useImageDimensions";
import { useObjectUrl } from "../../../hooks/useObjectUrl";
import { useBrandRules } from "../../../hooks/useBrandRules";
import { useBrandProfile } from "../../../hooks/useBrandProfile";
import { colorDistance } from "../../../lib/colorConvert";
import { ImageToolLayout } from "../image/ImageToolLayout";
import { WorkspaceShell } from "../../workspace/WorkspaceShell";
import type { PaletteResult } from "../../../workers/imageProcessing.types";
import type { ToolDefinition } from "../../../types/tool";
import imageStyles from "../image/ImageTool.module.css";
import assetStyles from "../assets/MultiFile.module.css";
import preflightStyles from "../qa/PreflightWorkspace.module.css";

type Status = "pass" | "warning" | "fail" | "skip";
const STATUS_ICON: Record<Status, string> = { pass: "✓", warning: "⚠", fail: "✕", skip: "—" };

export default function BrandValidatorWorkspace({ tool }: { tool: ToolDefinition }) {
  const { rules, setRules } = useBrandRules();
  const { profile } = useBrandProfile();
  const { files, error, importFiles, reset } = useFileImport({ acceptedTypes: ["image/*"], multiple: false });
  const file = files[0] ?? null;
  const originalUrl = useObjectUrl(file);
  const dimensions = useImageDimensions(file);
  const { run } = useImageProcessor();

  const [newColor, setNewColor] = useState("#2f5fff");
  const [palette, setPalette] = useState<PaletteResult | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!file) {
      setPalette(null);
      return;
    }
    setChecking(true);
    run<PaletteResult>({ op: "palette", file, colorCount: 6 })
      .promise.then((res) => {
        setPalette(res);
        setChecking(false);
      })
      .catch(() => setChecking(false));
  }, [file, run]);

  const addApprovedColor = () => {
    if (rules.approvedColorHexes.includes(newColor)) return;
    setRules({ ...rules, approvedColorHexes: [...rules.approvedColorHexes, newColor] });
  };

  const removeApprovedColor = (hex: string) => {
    setRules({ ...rules, approvedColorHexes: rules.approvedColorHexes.filter((h) => h !== hex) });
  };

  const loadFromBrand = () => {
    const merged = Array.from(new Set([...rules.approvedColorHexes, ...profile.colors.map((c) => c.hex)]));
    setRules({ ...rules, approvedColorHexes: merged });
  };

  const toleranceThreshold = (rules.colorTolerance / 100) * 441.7; // max possible RGB distance

  const colorMatches = palette
    ? palette.colors.map((c) => ({
        color: c,
        matched: rules.approvedColorHexes.length === 0 || rules.approvedColorHexes.some((approved) => colorDistance(approved, c.hex) <= toleranceThreshold),
      }))
    : [];
  const unmatchedCount = colorMatches.filter((m) => !m.matched).length;

  const checks: { label: string; status: Status; detail: string }[] = [];
  if (rules.approvedColorHexes.length === 0) {
    checks.push({ label: "Colors", status: "skip", detail: "No approved colors defined" });
  } else if (palette) {
    checks.push({
      label: "Colors",
      status: unmatchedCount === 0 ? "pass" : "warning",
      detail: unmatchedCount === 0 ? "All dominant colors match the approved palette" : `${unmatchedCount} of ${palette.colors.length} dominant colors are off-brand`,
    });
  }

  checks.push({
    label: "Font",
    status: rules.approvedFont ? "warning" : "skip",
    detail: rules.approvedFont ? `Can't be detected automatically — verify it's set in ${rules.approvedFont}` : "No approved font defined",
  });

  if (dimensions) {
    const withinWidth = dimensions.width <= rules.maxLogoWidth;
    checks.push({
      label: "Max width",
      status: withinWidth ? "pass" : "fail",
      detail: withinWidth ? `${dimensions.width}px is within the ${rules.maxLogoWidth}px limit` : `${dimensions.width}px exceeds the ${rules.maxLogoWidth}px limit`,
    });
  }

  const handleChangeFile = () => {
    reset();
    setPalette(null);
  };

  return (
    <WorkspaceShell title={tool.name}>
      <div className={assetStyles.group} style={{ marginBottom: "var(--space-5)" }}>
        <span className={assetStyles.groupTitle}>Brand rules</span>
        <div className={imageStyles.row} style={{ flexWrap: "wrap", gap: "var(--space-3)" }}>
          <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} />
          <button className={assetStyles.secondaryButton} onClick={addApprovedColor}>
            Add approved color
          </button>
          <button className={assetStyles.secondaryButton} onClick={loadFromBrand} disabled={profile.colors.length === 0}>
            Load from Brand Colors
          </button>
        </div>
        <div className={assetStyles.chipRow}>
          {rules.approvedColorHexes.map((hex) => (
            <button key={hex} className={assetStyles.chip} onClick={() => removeApprovedColor(hex)} title="Click to remove">
              <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: hex, marginRight: 6 }} />
              {hex}
            </button>
          ))}
        </div>
        <div className={imageStyles.row} style={{ flexWrap: "wrap", gap: "var(--space-4)", marginTop: "var(--space-2)" }}>
          <div className={imageStyles.field}>
            <span className={imageStyles.fieldLabel}>Approved font</span>
            <input className={imageStyles.input} value={rules.approvedFont} onChange={(e) => setRules({ ...rules, approvedFont: e.target.value })} placeholder="e.g. Inter" />
          </div>
          <div className={imageStyles.field}>
            <span className={imageStyles.fieldLabel}>Max logo width (px)</span>
            <input
              className={imageStyles.input}
              type="number"
              value={rules.maxLogoWidth}
              onChange={(e) => setRules({ ...rules, maxLogoWidth: Number(e.target.value) })}
            />
          </div>
          <div className={imageStyles.field}>
            <span className={imageStyles.fieldLabel}>Color tolerance — {rules.colorTolerance}%</span>
            <input
              className={imageStyles.slider}
              type="range"
              min={0}
              max={40}
              value={rules.colorTolerance}
              onChange={(e) => setRules({ ...rules, colorTolerance: Number(e.target.value) })}
            />
          </div>
        </div>
      </div>

      <ImageToolLayout
        file={file}
        error={error}
        onFiles={importFiles}
        onChangeFile={handleChangeFile}
        settings={<span className={imageStyles.statusRow}>Import an asset to check it against the rules above.</span>}
        preview={
          <div className={imageStyles.previewArea}>
            {originalUrl && <img className={imageStyles.previewImage} src={originalUrl} alt="Source" />}
          </div>
        }
        footer={
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", width: "100%" }}>
            {checking && <span className={imageStyles.statusRow}>Checking…</span>}
            <div className={preflightStyles.checklist}>
              {checks.map((check) => (
                <div className={preflightStyles.row} key={check.label}>
                  <span className={preflightStyles.status} data-status={check.status} aria-hidden="true">
                    {STATUS_ICON[check.status]}
                  </span>
                  <span className={preflightStyles.label}>{check.label}</span>
                  <span className={preflightStyles.detail}>{check.detail}</span>
                </div>
              ))}
            </div>
          </div>
        }
      />
    </WorkspaceShell>
  );
}
