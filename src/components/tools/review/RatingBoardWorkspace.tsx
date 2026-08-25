import { useState } from "react";
import { useFileImport } from "../../../hooks/useFileImport";
import { useObjectUrls } from "../../../hooks/useObjectUrls";
import { MultiFileStage } from "../assets/MultiFileStage";
import { WorkspaceShell } from "../../workspace/WorkspaceShell";
import type { ToolDefinition } from "../../../types/tool";
import assetStyles from "../assets/MultiFile.module.css";
import imageStyles from "../image/ImageTool.module.css";
import styles from "./RatingBoardWorkspace.module.css";

const CATEGORIES = ["composition", "typography", "brand", "color"] as const;
type Category = (typeof CATEGORIES)[number];

interface Ratings {
  overall: number;
  composition: number;
  typography: number;
  brand: number;
  color: number;
}

function emptyRatings(): Ratings {
  return { overall: 0, composition: 0, typography: 0, brand: 0, color: 0 };
}

function Stars({ value, onChange, size = "normal" }: { value: number; onChange: (v: number) => void; size?: "normal" | "large" }) {
  return (
    <span className={size === "large" ? `${styles.stars} ${styles.overallStars}` : styles.stars}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} className={styles.star} data-filled={n <= value} onClick={() => onChange(n === value ? 0 : n)} aria-label={`${n} stars`}>
          ★
        </button>
      ))}
    </span>
  );
}

export default function RatingBoardWorkspace({ tool }: { tool: ToolDefinition }) {
  const { files, error, importFiles, reset, removeFile } = useFileImport({ acceptedTypes: ["image/*"], multiple: true });
  const fileUrls = useObjectUrls(files);
  const [ratings, setRatings] = useState<Record<string, Ratings>>({});
  const [showCategories, setShowCategories] = useState(false);
  const [sortByRating, setSortByRating] = useState(false);

  const keyFor = (file: File, index: number) => `${file.name}-${index}`;

  const ratingFor = (key: string) => ratings[key] ?? emptyRatings();

  const updateRating = (key: string, field: keyof Ratings, value: number) => {
    setRatings((prev) => ({ ...prev, [key]: { ...ratingFor(key), [field]: value } }));
  };

  const indexed = files.map((file, index) => ({ file, index, key: keyFor(file, index) }));
  const sorted = sortByRating ? [...indexed].sort((a, b) => ratingFor(b.key).overall - ratingFor(a.key).overall) : indexed;

  const handleClear = () => {
    reset();
    setRatings({});
  };

  return (
    <WorkspaceShell title={tool.name}>
      <MultiFileStage files={files} error={error} accept="image/*" dropLabel="Import assets to rate" onFiles={importFiles} onClear={handleClear}>
        <div className={assetStyles.chipRow} style={{ marginBottom: "var(--space-4)" }}>
          <button className={assetStyles.chip} data-active={showCategories} onClick={() => setShowCategories((v) => !v)}>
            {showCategories ? "Hide category ratings" : "Show category ratings"}
          </button>
          <button className={assetStyles.chip} data-active={sortByRating} onClick={() => setSortByRating((v) => !v)}>
            Sort by rating
          </button>
        </div>

        <div className={assetStyles.grid}>
          {sorted.map(({ file, index, key }) => {
            const r = ratingFor(key);
            return (
              <div className={styles.card} key={key}>
                <img className={styles.thumb} src={fileUrls.get(file)} alt={file.name} />
                <div className={styles.info}>
                  <span className={styles.name}>{file.name}</span>
                  <Stars value={r.overall} onChange={(v) => updateRating(key, "overall", v)} size="large" />
                  {showCategories &&
                    CATEGORIES.map((cat: Category) => (
                      <div className={styles.categoryRow} key={cat}>
                        <span style={{ textTransform: "capitalize" }}>{cat}</span>
                        <Stars value={r[cat]} onChange={(v) => updateRating(key, cat, v)} />
                      </div>
                    ))}
                  <button className={assetStyles.secondaryButton} onClick={() => removeFile(index)}>
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {files.length === 0 && <span className={imageStyles.statusRow}>Import images to start rating.</span>}
      </MultiFileStage>
    </WorkspaceShell>
  );
}
