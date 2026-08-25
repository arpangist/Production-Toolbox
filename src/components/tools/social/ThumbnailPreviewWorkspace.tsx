import { useFileImport } from "../../../hooks/useFileImport";
import { useObjectUrl } from "../../../hooks/useObjectUrl";
import { ImageToolLayout } from "../image/ImageToolLayout";
import { WorkspaceShell } from "../../workspace/WorkspaceShell";
import type { ToolDefinition } from "../../../types/tool";
import imageStyles from "../image/ImageTool.module.css";

const SIZES = [
  { label: "Full", width: 480 },
  { label: "Desktop", width: 320 },
  { label: "Mobile", width: 160 },
  { label: "Small", width: 72 },
];

export default function ThumbnailPreviewWorkspace({ tool }: { tool: ToolDefinition }) {
  const { files, error, importFiles, reset } = useFileImport({ acceptedTypes: ["image/*"], multiple: false });
  const file = files[0] ?? null;
  const url = useObjectUrl(file);

  return (
    <WorkspaceShell title={tool.name}>
      <ImageToolLayout
        file={file}
        error={error}
        onFiles={importFiles}
        onChangeFile={reset}
        settings={
          <span className={imageStyles.statusRow}>
            Check whether typography, subject, and composition still read once the image shrinks.
          </span>
        }
        preview={<div />}
        footer={
          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-5)", alignItems: "flex-end", width: "100%" }}>
            {url &&
              SIZES.map((size) => (
                <div key={size.label} style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                  <span className={imageStyles.fieldLabel}>
                    {size.label} — {size.width}px
                  </span>
                  <img
                    src={url}
                    alt={`${size.label} preview`}
                    style={{ width: size.width, display: "block", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)" }}
                  />
                </div>
              ))}
          </div>
        }
      />
    </WorkspaceShell>
  );
}
