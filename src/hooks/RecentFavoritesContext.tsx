import type { ReactNode } from "react";
import { useRecentFavorites } from "./useRecentFavorites";
import { RecentFavoritesContext } from "./recentFavoritesContextObject";

export function RecentFavoritesProvider({ children }: { children: ReactNode }) {
  const value = useRecentFavorites();
  return <RecentFavoritesContext.Provider value={value}>{children}</RecentFavoritesContext.Provider>;
}
