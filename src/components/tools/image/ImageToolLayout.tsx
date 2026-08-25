import type { ReactNode } from "react";
import { DropZone } from "../../fileengine/DropZone";
import styles from "./ImageTool.module.css";

interface ImageToolLayoutProps {
  file: File | null;
  error: string | null;
  onFiles: (files: FileList) => void;
  onChangeFile: () => void;
  settings: ReactNode;
  preview: ReactNode;
  footer: ReactNode;
}

export function ImageToolLayout({
  file,
  error,
  onFiles,
  onChangeFile,
  settings,
  preview,
  footer,
}: ImageToolLayoutProps) {
  if (!file) {
    return <DropZone label="Import an image" hint="JPEG, PNG, WebP, or AVIF" accept="image/*" multiple={false} error={error} onFiles={onFiles} />;
  }

  return (
    <>
      <button className={styles.changeFileButton} onClick={onChangeFile}>
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
