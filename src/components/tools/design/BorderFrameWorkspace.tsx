import { useEffect, useRef, useState } from "react";
import { useFileImport } from "../../../hooks/useFileImport";
import { useImageProcessor } from "../../../hooks/useImageProcessor";
import { useDebouncedValue } from "../../../hooks/useDebouncedValue";
import { useObjectUrl } from "../../../hooks/useObjectUrl";
import { WorkspaceShell } from "../../workspace/WorkspaceShell";
import { ImageToolLayout } from "../image/ImageToolLayout";
import { downloadBlob } from "../../../lib/downloadFile";
import { formatBytes } from "../../../lib/format";
import { FRAME_PRESETS, type FrameSettings } from "../../../lib/framePresets";
import type { BorderStyle, ImageOpResult } from "../../../workers/imageProcessing.types";
import type { ToolDefinition } from "../../../types/tool";
import imageStyles from "../image/ImageTool.module.css";

export default function BorderFrameWorkspace({ tool }: { tool: ToolDefinition }) {
  const { files, error, importFiles, reset } = useFileImport({ acceptedTypes: ["image/*"], multiple: false });
  const file = files[0] ?? null;
  const { run } = useImageProcessor();

  const [settings, setSettings] = useState<FrameSettings>(FRAME_PRESETS[0]);
  const [presetLabel, setPresetLabel] = useState(FRAME_PRESETS[0].label);

  const [result, setResult] = useState<ImageOpResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [processError, setProcessError] = useState<string | null>(null);
  const cancelRef = useRef<(() => void) | null>(null);

  const debouncedSettings = useDebouncedValue(settings, 200);

  useEffect(() => {
    if (!file) return;
    cancelRef.current?.();
    setProcessing(true);
    setProgress(0);
    setProcessError(null);

    const handle = run<ImageOpResult>(
      { op: "frame", file, format: "image/png", quality: 0.92, ...debouncedSettings },
      setProgress,
    );
    cancelRef.current = handle.cancel;

    handle.promise
      .then((res) => {
        setResult(res);
        setProcessing(false);
      })
      .catch((err: Error) => {
        if (err.message === "Cancelled") return;
        setProcessError(err.message);
        setProcessing(false);
      });

    return () => handle.cancel();
  }, [file, debouncedSettings, run]);

  const resultUrl = useObjectUrl(result?.blob ?? null);

  const update = (patch: Partial<FrameSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
    setPresetLabel("");
  };

  const applyPreset = (preset: FrameSettings & { label: string }) => {
    setSettings(preset);
    setPresetLabel(preset.label);
  };

  const handleDownload = () => {
    if (!result || !file) return;
    downloadBlob(result.blob, file.name.replace(/\.[^./]+$/, "") + "-framed.png");
  };

  const handleChangeFile = () => {
    reset();
    setResult(null);
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
              <span className={imageStyles.fieldLabel}>Presets</span>
              <div className={imageStyles.chipRow}>
                {FRAME_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    className={imageStyles.chip}
                    data-active={presetLabel === preset.label}
                    onClick={() => applyPreset(preset)}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={imageStyles.field}>
              <span className={imageStyles.fieldLabel}>Outer padding — {settings.outerPadding}px</span>
              <input
                className={imageStyles.slider}
                type="range"
                min={0}
                max={120}
                value={settings.outerPadding}
                onChange={(e) => update({ outerPadding: Number(e.target.value) })}
              />
            </div>

            <div className={imageStyles.field}>
              <span className={imageStyles.fieldLabel}>Border width — {settings.borderWidth}px</span>
              <input
                className={imageStyles.slider}
                type="range"
                min={0}
                max={24}
                value={settings.borderWidth}
                onChange={(e) => update({ borderWidth: Number(e.target.value) })}
              />
            </div>

            {settings.borderWidth > 0 && (
              <>
                <div className={imageStyles.field}>
                  <span className={imageStyles.fieldLabel}>Border style</span>
                  <select
                    className={imageStyles.select}
                    value={settings.borderStyle}
                    onChange={(e) => update({ borderStyle: e.target.value as BorderStyle })}
                  >
                    <option value="solid">Solid</option>
                    <option value="dashed">Dashed</option>
                    <option value="dotted">Dotted</option>
                  </select>
                </div>
                <div className={imageStyles.field}>
                  <span className={imageStyles.fieldLabel}>Border color</span>
                  <input type="color" value={settings.borderColor} onChange={(e) => update({ borderColor: e.target.value })} />
                </div>
              </>
            )}

            <div className={imageStyles.field}>
              <span className={imageStyles.fieldLabel}>Corner radius — {settings.cornerRadius}px</span>
              <input
                className={imageStyles.slider}
                type="range"
                min={0}
                max={80}
                value={settings.cornerRadius}
                onChange={(e) => update({ cornerRadius: Number(e.target.value) })}
              />
            </div>

            <label className={imageStyles.checkboxRow}>
              <input type="checkbox" checked={settings.shadow} onChange={(e) => update({ shadow: e.target.checked })} />
              Drop shadow
            </label>

            <label className={imageStyles.checkboxRow}>
              <input
                type="checkbox"
                checked={settings.transparentBackground}
                onChange={(e) => update({ transparentBackground: e.target.checked })}
              />
              Transparent background
            </label>

            {!settings.transparentBackground && (
              <div className={imageStyles.field}>
                <span className={imageStyles.fieldLabel}>Background color</span>
                <input type="color" value={settings.backgroundColor} onChange={(e) => update({ backgroundColor: e.target.value })} />
              </div>
            )}
          </>
        }
        preview={
          <div className={imageStyles.previewArea}>
            {resultUrl ? (
              <img className={imageStyles.previewImage} src={resultUrl} alt="Framed preview" />
            ) : (
              <span className={imageStyles.statusRow}>{processing ? "Processing…" : "Waiting for input"}</span>
            )}
          </div>
        }
        footer={
          <div className={imageStyles.footer}>
            <div className={imageStyles.sizeCompare}>
              {file && <span>Original {formatBytes(file.size)}</span>}
              {result && (
                <span>
                  Output {formatBytes(result.blob.size)} · {result.width}×{result.height}
                </span>
              )}
              {processing && (
                <span className={imageStyles.statusRow} role="status" aria-live="polite">
                  Processing… {Math.round(progress * 100)}%
                </span>
              )}
              {processError && <span className={imageStyles.errorText}>This image couldn't be processed.</span>}
            </div>
            <button className={imageStyles.downloadButton} disabled={!result || processing} onClick={handleDownload}>
              Download
            </button>
          </div>
        }
      />
    </WorkspaceShell>
  );
}
