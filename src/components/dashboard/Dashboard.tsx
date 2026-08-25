import { useMemo } from "react";
import { Link } from "react-router-dom";
import { tools } from "../../registry/tools";
import { CATEGORY_LABELS, type ToolCategory } from "../../types/tool";
import { useRecentFavoritesContext } from "../../hooks/useRecentFavoritesContext";
import { CategorySection } from "./CategorySection";
import { ToolCard } from "./ToolCard";
import { StarIcon, ClockIcon } from "../icons/uiIcons";
import styles from "./Dashboard.module.css";

const CATEGORY_ORDER = Object.keys(CATEGORY_LABELS) as ToolCategory[];

export function Dashboard() {
  const { recentIds, favoriteIds, loaded } = useRecentFavoritesContext();

  const byId = useMemo(() => new Map(tools.map((tool) => [tool.id, tool])), []);
  const recentTools = recentIds.map((id) => byId.get(id)).filter((tool) => !!tool);
  const favoriteTools = favoriteIds.map((id) => byId.get(id)).filter((tool) => !!tool);

  return (
    <div className={styles.page}>
      <div className={styles.intro}>
        <h1 className={styles.title}>Creative Production Toolbox</h1>
        <p className={styles.subtitle}>
          Professional creative utilities. Zero upload. Zero AI. Zero API keys.
        </p>
      </div>

      {loaded && favoriteTools.length > 0 && (
        <section className={styles.section} aria-labelledby="favorites-heading">
          <div className={styles.sectionHeader}>
            <h2 id="favorites-heading" className={styles.sectionTitle}>
              <span className={styles.sectionIcon} aria-hidden="true">
                <StarIcon size={15} filled />
              </span>
              Favorites
            </h2>
          </div>
          <div className={styles.grid}>
            {favoriteTools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </section>
      )}

      {loaded && recentTools.length > 0 && (
        <section className={styles.section} aria-labelledby="recent-heading">
          <div className={styles.sectionHeader}>
            <h2 id="recent-heading" className={styles.sectionTitle}>
              <span className={styles.sectionIcon} aria-hidden="true">
                <ClockIcon size={15} />
              </span>
              Recent
            </h2>
          </div>
          <div className={styles.grid}>
            {recentTools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </section>
      )}

      {CATEGORY_ORDER.map((category) => (
        <CategorySection
          key={category}
          category={category}
          tools={tools.filter((tool) => tool.category === category)}
        />
      ))}

      <Link to="/diagnostics" className={styles.diagnosticsLink}>
        System check — preview the local file &amp; processing pipeline
      </Link>
    </div>
  );
}
