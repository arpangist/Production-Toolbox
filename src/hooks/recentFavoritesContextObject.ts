import { createContext } from "react";
import type { useRecentFavorites } from "./useRecentFavorites";

export type RecentFavoritesValue = ReturnType<typeof useRecentFavorites>;

export const RecentFavoritesContext = createContext<RecentFavoritesValue | null>(null);
