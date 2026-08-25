import { useCallback, useRef, useState, type DragEvent, type KeyboardEvent } from "react";
import { UploadIcon } from "../icons/uiIcons";
import styles from "./DropZone.module.css";

interface DropZoneProps {
  label: string;
  hint?: string;
  accept?: string;
  multiple?: boolean;
  error?: string | null;
  onFiles: (files: FileList) => void;
}

export function DropZone({ label, hint, accept, multiple = true, error, onFiles }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const openPicker = useCallback(() => inputRef.current?.click(), []);

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDragActive(false);
      if (event.dataTransfer.files.length > 0) onFiles(event.dataTransfer.files);
    },
    [onFiles],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openPicker();
      }
    },
    [openPicker],
  );

  return (
    <div>
      <div
        className={styles.zone}
        data-active={dragActive}
        role="button"
        tabIndex={0}
        aria-label={`${label}. ${hint ?? ""}`}
        onClick={openPicker}
        onKeyDown={handleKeyDown}
        onDragOver={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
      >
        <span className={styles.iconWrap} aria-hidden="true">
          <UploadIcon size={22} />
        </span>
        <span className={styles.title}>{label}</span>
        {hint && <span className={styles.subtitle}>{hint}</span>}
        <span className={styles.subtitle}>
          Drop a file here or <span className={styles.browse}>browse</span>
        </span>
        <input
          ref={inputRef}
          className={styles.input}
          type="file"
          accept={accept}
          multiple={multiple}
          tabIndex={-1}
          onChange={(event) => {
            if (event.target.files && event.target.files.length > 0) {
              onFiles(event.target.files);
            }
            event.target.value = "";
          }}
        />
      </div>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
