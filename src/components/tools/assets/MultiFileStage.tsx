import type { ReactNode } from "react";
import { DropZone } from "../../fileengine/DropZone";
import styles from "./MultiFile.module.css";

interface MultiFileStageProps {
  files: File[];
  error: string | null;
  accept: string;
  dropLabel: string;
  dropHint?: string;
  onFiles: (files: FileList) => void;
  onClear: () => void;
  children: ReactNode;
}

export function MultiFileStage({ files, error, accept, dropLabel, dropHint, onFiles, onClear, children }: MultiFileStageProps) {
  return (
    <div className={styles.page}>
      {files.length === 0 ? (
        <DropZone label={dropLabel} hint={dropHint} accept={accept} multiple onFiles={onFiles} error={error} />
      ) : (
        <div className={styles.topBar}>
          <span className={styles.addMoreLabel}>{files.length} file{files.length === 1 ? "" : "s"} loaded</span>
          <button className={styles.clearButton} onClick={onClear}>
            Clear all
          </button>
        </div>
      )}
      {error && files.length > 0 && <p className={styles.errorText}>{error}</p>}
      {files.length > 0 && children}
    </div>
  );
}
