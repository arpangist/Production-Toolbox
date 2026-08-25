import { useEffect, useState } from "react";
import { useFileImport } from "../../../hooks/useFileImport";
import { useObjectUrl } from "../../../hooks/useObjectUrl";
import { WorkspaceShell } from "../../workspace/WorkspaceShell";
import { ImageToolLayout } from "../image/ImageToolLayout";
import { readImageInfo } from "../../../lib/imageInfo";
import { runPreflight, type CheckItem, type ImageInfo, type PreflightRequirements } from "../../../lib/preflight";
import type { ToolDefinition } from "../../../types/tool";
import imageStyles from "../image/ImageTool.module.css";
import styles from "./PreflightWorkspace.module.css";

const STATUS_ICON: Record<CheckItem["status"], string> = {
  pass: "✓",
  warning: "⚠",
  fail: "✕",
  skip: "—",
};

const ALL_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function PreflightWorkspace({ tool }: { tool: ToolDefinition }) {
  const { files, error, importFiles, reset } = useFileImport({ acceptedTypes: ["image/*"], multiple: false });
  const file = files[0] ?? null;
  const originalUrl = useObjectUrl(file);

  const [targetWidth, setTargetWidth] = useState("");
  const [targetHeight, setTargetHeight] = useState("");
  const [minWidth, setMinWidth] = useState("");
  const [minHeight, setMinHeight] = useState("");
  const [allowedTypes, setAllowedTypes] = useState<string[]>([]);
  const [maxSizeMb, setMaxSizeMb] = useState("");
  const [transparency, setTransparency] = useState<PreflightRequirements["transparency"]>("any");

  const [info, setInfo] = useState<ImageInfo | null>(null);
  const [infoError, setInfoError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!file) {
      setInfo(null);
      return;
    }
    setInfoError(null);
    readImageInfo(file)
      .then(setInfo)
      .catch((err: Error) => setInfoError(err.message));
  }, [file]);

  const requirements: PreflightRequirements = {
    targetWidth: targetWidth ? Number(targetWidth) : null,
    targetHeight: targetHeight ? Number(targetHeight) : null,
    minWidth: minWidth ? Number(minWidth) : null,
    minHeight: minHeight ? Number(minHeight) : null,
    allowedTypes,
    maxSizeBytes: maxSizeMb ? Number(maxSizeMb) * 1024 * 1024 : null,
    transparency,
  };

  const checks = info ? runPreflight(info, requirements) : [];
  const passed = checks.filter((c) => c.status === "pass").length;
  const warnings = checks.filter((c) => c.status === "warning").length;
  const failed = checks.filter((c) => c.status === "fail").length;

  const toggleType = (type: string) => {
    setAllowedTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]));
  };

  const copyReport = async () => {
    const lines = [
      "EXPORT PREFLIGHT",
      ...checks.map((c) => `${c.label.padEnd(16)} ${STATUS_ICON[c.status]}  ${c.detail}`),
      "",
      `RESULT: ${passed} Passed, ${warnings} Warning, ${failed} Errors`,
    ];
    await navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleChangeFile = () => {
    reset();
    setInfo(null);
  };

  return (
    <WorkspaceShell title={tool.name}>
      <ImageToolLayout
        file={file}
        error={error}
        onFiles={importFiles}
        onChangeFile={handleChangeFile}
        settings={
          <>
            <div className={imageStyles.field}>
              <span className={imageStyles.fieldLabel}>Target dimensions</span>
              <div className={styles.formRow}>
                <input
                  className={imageStyles.input}
                  type="number"
                  placeholder="Width"
                  value={targetWidth}
                  onChange={(e) => setTargetWidth(e.target.value)}
                  aria-label="Target width"
                />
                <span aria-hidden="true">×</span>
                <input
                  className={imageStyles.input}
                  type="number"
                  placeholder="Height"
                  value={targetHeight}
                  onChange={(e) => setTargetHeight(e.target.value)}
                  aria-label="Target height"
                />
              </div>
            </div>

            <div className={imageStyles.field}>
              <span className={imageStyles.fieldLabel}>Minimum resolution</span>
              <div className={styles.formRow}>
                <input
                  className={imageStyles.input}
                  type="number"
                  placeholder="Min width"
                  value={minWidth}
                  onChange={(e) => setMinWidth(e.target.value)}
                  aria-label="Minimum width"
                />
                <span aria-hidden="true">×</span>
                <input
                  className={imageStyles.input}
                  type="number"
                  placeholder="Min height"
                  value={minHeight}
                  onChange={(e) => setMinHeight(e.target.value)}
                  aria-label="Minimum height"
                />
              </div>
            </div>

            <div className={imageStyles.field}>
              <span className={imageStyles.fieldLabel}>Allowed file types</span>
              <div className={styles.checkboxGroup}>
                {ALL_TYPES.map((type) => (
                  <label className={styles.checkboxRow} key={type}>
                    <input type="checkbox" checked={allowedTypes.includes(type)} onChange={() => toggleType(type)} />
                    {type}
                  </label>
                ))}
              </div>
            </div>

            <div className={imageStyles.field}>
              <span className={imageStyles.fieldLabel}>Max file size (MB)</span>
              <input
                className={imageStyles.input}
                type="number"
                step="0.1"
                placeholder="e.g. 2"
                value={maxSizeMb}
                onChange={(e) => setMaxSizeMb(e.target.value)}
                aria-label="Maximum file size in megabytes"
              />
            </div>

            <div className={imageStyles.field}>
              <span className={imageStyles.fieldLabel}>Transparency</span>
              <select
                className={imageStyles.select}
                value={transparency}
                onChange={(e) => setTransparency(e.target.value as PreflightRequirements["transparency"])}
              >
                <option value="any">Any</option>
                <option value="required">Required</option>
                <option value="disallowed">Not allowed</option>
              </select>
            </div>
          </>
        }
        preview={
          <div className={imageStyles.previewArea}>
            {originalUrl && <img className={imageStyles.previewImage} src={originalUrl} alt="Source" />}
          </div>
        }
        footer={
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", width: "100%" }}>
            {infoError && (
              <span className={imageStyles.errorText} role="alert">
                {infoError}
              </span>
            )}
            {info && (
              <>
                <div className={styles.checklist}>
                  {checks.map((check) => (
                    <div className={styles.row} key={check.label}>
                      <span className={styles.status} data-status={check.status} aria-hidden="true">
                        {STATUS_ICON[check.status]}
                      </span>
                      <span className={styles.label}>{check.label}</span>
                      <span className={styles.detail}>{check.detail}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.summary}>
                  <span className={styles.summaryItem}>
                    <strong>{passed}</strong>Passed
                  </span>
                  <span className={styles.summaryItem}>
                    <strong>{warnings}</strong>Warning
                  </span>
                  <span className={styles.summaryItem}>
                    <strong>{failed}</strong>Errors
                  </span>
                </div>
                <button className={styles.copyButton} onClick={copyReport}>
                  {copied ? "Copied!" : "Copy report"}
                </button>
              </>
            )}
          </div>
        }
      />
    </WorkspaceShell>
  );
}
