import { useState } from "react";
import { useFileImport } from "../../../hooks/useFileImport";
import { useObjectUrls } from "../../../hooks/useObjectUrls";
import { MultiFileStage } from "../assets/MultiFileStage";
import { WorkspaceShell } from "../../workspace/WorkspaceShell";
import type { ToolDefinition } from "../../../types/tool";
import assetStyles from "../assets/MultiFile.module.css";
import imageStyles from "../image/ImageTool.module.css";
import styles from "./ApprovalTrackerWorkspace.module.css";

type Status = "draft" | "review" | "changes" | "approved";

const STATUS_ORDER: Status[] = ["draft", "review", "changes", "approved"];
const STATUS_LABEL: Record<Status, string> = { draft: "Draft", review: "Review", changes: "Changes Required", approved: "Approved" };

export default function ApprovalTrackerWorkspace({ tool }: { tool: ToolDefinition }) {
  const { files, error, importFiles, reset, removeFile } = useFileImport({ acceptedTypes: ["image/*"], multiple: true });
  const fileUrls = useObjectUrls(files);
  const [statuses, setStatuses] = useState<Record<string, Status>>({});

  const keyFor = (file: File, index: number) => `${file.name}-${index}`;
  const statusFor = (key: string) => statuses[key] ?? "draft";
  const setStatus = (key: string, status: Status) => setStatuses((prev) => ({ ...prev, [key]: status }));

  const handleClear = () => {
    reset();
    setStatuses({});
  };

  const counts = STATUS_ORDER.reduce(
    (acc, status) => {
      acc[status] = files.filter((f, i) => statusFor(keyFor(f, i)) === status).length;
      return acc;
    },
    {} as Record<Status, number>,
  );

  return (
    <WorkspaceShell title={tool.name}>
      <MultiFileStage files={files} error={error} accept="image/*" dropLabel="Import assets to track" onFiles={importFiles} onClear={handleClear}>
        {files.length > 0 && (
          <div className={styles.summary}>
            {STATUS_ORDER.map((status) => (
              <span key={status}>
                {STATUS_LABEL[status]} <strong className="mono">{counts[status]}</strong>
              </span>
            ))}
          </div>
        )}

        <div className={assetStyles.grid}>
          {files.map((file, index) => {
            const key = keyFor(file, index);
            const status = statusFor(key);
            return (
              <div className={styles.card} data-status={status} key={key}>
                <img className={styles.thumb} src={fileUrls.get(file)} alt={file.name} />
                <div className={styles.info}>
                  <span className={styles.name}>{file.name}</span>
                  <span className={styles.statusLabel} style={{ color: `var(--color-${status === "approved" ? "success" : status === "changes" ? "error" : status === "review" ? "warning" : "text-secondary"})` }}>
                    {STATUS_LABEL[status]}
                  </span>
                  <select className={imageStyles.select} value={status} onChange={(e) => setStatus(key, e.target.value as Status)}>
                    {STATUS_ORDER.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABEL[s]}
                      </option>
                    ))}
                  </select>
                  <button className={assetStyles.secondaryButton} onClick={() => removeFile(index)}>
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {files.length === 0 && <span className={imageStyles.statusRow}>Import assets to start tracking approval status.</span>}
      </MultiFileStage>
    </WorkspaceShell>
  );
}
