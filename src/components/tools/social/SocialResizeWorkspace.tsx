import { useEffect, useRef, useState } from "react";
import { useFileImport } from "../../../hooks/useFileImport";
import { useImageDimensions } from "../../../hooks/useImageDimensions";
import { useImageProcessor } from "../../../hooks/useImageProcessor";
import { useDebouncedValue } from "../../../hooks/useDebouncedValue";
import { useObjectUrl } from "../../../hooks/useObjectUrl";
import { WorkspaceShell } from "../../workspace/WorkspaceShell";
import { ImageToolLayout } from "../image/ImageToolLayout";
import { downloadBlob } from "../../../lib/downloadFile";
import { formatBytes } from "../../../lib/format";
import { withExtension } from "../../../lib/imageFormat";
import { computeCoverRect } from "../../../lib/coverCrop";
import { SOCIAL_PLATFORMS, type SocialPreset } from "../../../lib/socialPresets";
import type { ImageOpResult, SourceRect } from "../../../workers/imageProcessing.types";
import type { ToolDefinition } from "../../../types/tool";
import imageStyles from "../image/ImageTool.module.css";

export default function SocialResizeWorkspace({ tool }: { tool: ToolDefinition }) {
  const { files, error, importFiles, reset } = useFileImport({ acceptedTypes: ["image/*"], multiple: false });
  const file = files[0] ?? null;
  const dimensions = useImageDimensions(file);
  const { run } = useImageProcessor();

  const [platformIndex, setPlatformIndex] = useState(0);
  const [preset, setPreset] = useState<SocialPreset>(SOCIAL_PLATFORMS[0].presets[0]);
  const [sourceRect, setSourceRect] = useState<SourceRect | null>(null);

  const [result, setResult] = useState<ImageOpResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [processError, setProcessError] = useState<string | null>(null);
  const cancelRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (dimensions) {
      setSourceRect(computeCoverRect(dimensions.width, dimensions.height, preset.width, preset.height));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dimensions, preset]);

  const debouncedRect = useDebouncedValue(sourceRect, 200);

  useEffect(() => {
    if (!file || !debouncedRect) return;

    cancelRef.current?.();
    setProcessing(true);
    setProgress(0);
    setProcessError(null);

    const handle = run<ImageOpResult>(
      {
        op: "resize",
        file,
        width: preset.width,
        height: preset.height,
        sourceRect: debouncedRect,
        format: "image/jpeg",
        quality: 0.92,
      },
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, debouncedRect, run]);

  const resultUrl = useObjectUrl(result?.blob ?? null);

  const handleDownload = () => {
    if (!result || !file) return;
    downloadBlob(result.blob, withExtension(file.name, "image/jpeg"));
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
              <span className={imageStyles.fieldLabel}>Platform</span>
              <div className={imageStyles.chipRow}>
                {SOCIAL_PLATFORMS.map((platform, index) => (
                  <button
                    key={platform.name}
                    className={imageStyles.chip}
                    data-active={platformIndex === index}
                    onClick={() => {
                      setPlatformIndex(index);
                      setPreset(SOCIAL_PLATFORMS[index].presets[0]);
                    }}
                  >
                    {platform.name}
                  </button>
                ))}
              </div>
            </div>

            <div className={imageStyles.field}>
              <span className={imageStyles.fieldLabel}>Format</span>
              <div className={imageStyles.chipRow}>
                {SOCIAL_PLATFORMS[platformIndex].presets.map((option) => (
                  <button
                    key={option.label}
                    className={imageStyles.chip}
                    data-active={preset.label === option.label}
                    onClick={() => setPreset(option)}
                  >
                    {option.label} · {option.width}×{option.height}
                  </button>
                ))}
              </div>
            </div>
          </>
        }
        preview={
          <div className={imageStyles.previewArea}>
            {resultUrl ? (
              <img className={imageStyles.previewImage} src={resultUrl} alt="Social resize preview" />
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
              {processError && (
                <span className={imageStyles.errorText} role="alert">
                  This image couldn't be processed. Try a different file.
                </span>
              )}
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
