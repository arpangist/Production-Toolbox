import { useEffect, useState } from "react";
import { useFileImport } from "../../../hooks/useFileImport";
import { useObjectUrl } from "../../../hooks/useObjectUrl";
import { readImageInfo } from "../../../lib/imageInfo";
import { ratioLabel, type ImageInfo } from "../../../lib/preflight";
import { readExif, type ExifData } from "../../../lib/exif";
import { formatBytes } from "../../../lib/format";
import { ImageToolLayout } from "./ImageToolLayout";
import { WorkspaceShell } from "../../workspace/WorkspaceShell";
import type { ToolDefinition } from "../../../types/tool";
import imageStyles from "./ImageTool.module.css";
import styles from "../assets/MultiFile.module.css";

export default function MetadataWorkspace({ tool }: { tool: ToolDefinition }) {
  const { files, error, importFiles, reset } = useFileImport({ acceptedTypes: ["image/*"], multiple: false });
  const file = files[0] ?? null;
  const originalUrl = useObjectUrl(file);

  const [info, setInfo] = useState<ImageInfo | null>(null);
  const [exif, setExif] = useState<ExifData | null>(null);
  const [readErr, setReadErr] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setInfo(null);
      setExif(null);
      return;
    }
    setReadErr(null);
    Promise.all([readImageInfo(file), readExif(file)])
      .then(([imageInfo, exifData]) => {
        setInfo(imageInfo);
        setExif(exifData);
      })
      .catch(() => setReadErr("Couldn't read this file."));
  }, [file]);

  const handleChangeFile = () => {
    reset();
    setInfo(null);
    setExif(null);
  };

  const rows: { label: string; value: string }[] = file
    ? [
        { label: "Filename", value: file.name },
        { label: "File type", value: file.type || "unknown" },
        { label: "File size", value: formatBytes(file.size) },
        ...(info ? [{ label: "Width", value: `${info.width}px` }, { label: "Height", value: `${info.height}px` }] : []),
        ...(info ? [{ label: "Aspect ratio", value: ratioLabel(info.width, info.height) }] : []),
        ...(info ? [{ label: "Transparency", value: info.hasTransparency ? "Yes" : "No" }] : []),
      ]
    : [];

  const exifRows: { label: string; value: string }[] = exif
    ? [
        ...(exif.make ? [{ label: "Camera make", value: exif.make.trim() }] : []),
        ...(exif.model ? [{ label: "Camera model", value: exif.model.trim() }] : []),
        ...(exif.dateTime ? [{ label: "Date taken", value: exif.dateTime.trim() }] : []),
        ...(exif.orientation !== undefined ? [{ label: "Orientation", value: String(exif.orientation) }] : []),
      ]
    : [];

  return (
    <WorkspaceShell title={tool.name}>
      <ImageToolLayout
        file={file}
        error={error || readErr}
        onFiles={importFiles}
        onChangeFile={handleChangeFile}
        settings={<span className={imageStyles.statusRow}>Only metadata actually present in the file is shown — nothing is inferred.</span>}
        preview={
          <div className={imageStyles.previewArea}>
            {originalUrl && <img className={imageStyles.previewImage} src={originalUrl} alt="Source" />}
          </div>
        }
        footer={
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", width: "100%" }}>
            <div className={styles.group}>
              <span className={styles.groupTitle}>File</span>
              {rows.map((row) => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: "var(--color-text-secondary)" }}>{row.label}</span>
                  <span className="mono">{row.value}</span>
                </div>
              ))}
            </div>
            <div className={styles.group}>
              <span className={styles.groupTitle}>EXIF</span>
              {exifRows.length > 0 ? (
                exifRows.map((row) => (
                  <div key={row.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                    <span style={{ color: "var(--color-text-secondary)" }}>{row.label}</span>
                    <span className="mono">{row.value}</span>
                  </div>
                ))
              ) : (
                <span className={imageStyles.statusRow}>No EXIF data found in this file.</span>
              )}
            </div>
          </div>
        }
      />
    </WorkspaceShell>
  );
}
