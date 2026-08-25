import { Link } from "react-router-dom";
import type { ToolDefinition } from "../../types/tool";
import { useRecentFavoritesContext } from "../../hooks/useRecentFavoritesContext";
import { getToolIcon } from "../icons/toolIcons";
import { StarIcon } from "../icons/uiIcons";
import styles from "./ToolCard.module.css";

export function ToolCard({ tool }: { tool: ToolDefinition }) {
  const { favoriteIds, toggleFavorite } = useRecentFavoritesContext();
  const isFavorite = favoriteIds.includes(tool.id);
  const ToolIcon = getToolIcon(tool);

  return (
    <Link to={`/tool/${tool.id}`} className={styles.card}>
      <button
        className={styles.favorite}
        data-active={isFavorite}
        aria-pressed={isFavorite}
        aria-label={isFavorite ? `Remove ${tool.name} from favorites` : `Add ${tool.name} to favorites`}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          toggleFavorite(tool.id);
        }}
      >
        <StarIcon size={14} filled={isFavorite} aria-hidden="true" />
      </button>
      <span className={styles.icon} aria-hidden="true">
        <ToolIcon size={18} />
      </span>
      <span className={styles.name}>{tool.name}</span>
      {tool.status === "coming-soon" && <span className={styles.badge}>Coming soon</span>}
    </Link>
  );
}
