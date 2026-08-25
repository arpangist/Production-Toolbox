import { useContext } from "react";
import { RecentFavoritesContext, type RecentFavoritesValue } from "./recentFavoritesContextObject";

export function useRecentFavoritesContext(): RecentFavoritesValue {
  const context = useContext(RecentFavoritesContext);
  if (!context) {
    throw new Error("useRecentFavoritesContext must be used within a RecentFavoritesProvider");
  }
  return context;
}
