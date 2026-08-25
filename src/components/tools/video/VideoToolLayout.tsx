import type { ReactNode } from "react";
import { DropZone } from "../../fileengine/DropZone";
import styles from "./VideoTool.module.css";

interface VideoToolLayoutProps {
  file: File | null;
  error: string | null;
  onFiles: (files: FileList) => void;
  onChangeFile: () => void;
  settings: ReactNode;
  preview: ReactNode;
  footer: ReactNode;
}

export function VideoToolLayout({ file, error, onFiles, onChangeFile, settings, preview, footer }: VideoToolLayoutProps) {
  if (!file) {
    return <DropZone label="Import a video" hint="MP4 (H.264) or WebM" accept="video/*" multiple={false} error={error} onFiles={onFiles} />;
  }

  return (
    <>
      <button
        style={{ alignSelf: "flex-start", fontSize: 12, color: "var(--color-text-secondary)", textDecoration: "underline", background: "none", border: "none", padding: 0 }}
        onClick={onChangeFile}
      >
        Change file
      </button>
      <div className={styles.layout}>
        <div className={styles.settings}>{settings}</div>
        <div>{preview}</div>
      </div>
      {footer}
    </>
  );
}
