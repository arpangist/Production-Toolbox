import type { ToolDefinition, ToolCategory } from "../../types/tool";
import { CATEGORY_LABELS } from "../../types/tool";
import { CATEGORY_ICONS } from "../icons/categoryIcons";
import { ToolCard } from "./ToolCard";
import styles from "./Dashboard.module.css";

export function CategorySection({
  category,
  tools,
}: {
  category: ToolCategory;
  tools: ToolDefinition[];
}) {
  if (tools.length === 0) return null;
  const CategoryIcon = CATEGORY_ICONS[category];

  return (
    <section className={styles.section} aria-labelledby={`category-${category}`}>
      <div className={styles.sectionHeader}>
        <h2 id={`category-${category}`} className={styles.sectionTitle}>
          <span className={styles.sectionIcon} aria-hidden="true">
            <CategoryIcon size={15} />
          </span>
          {CATEGORY_LABELS[category]}
        </h2>
      </div>
      <div className={styles.grid}>
        {tools.map((tool) => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </div>
    </section>
  );
}
