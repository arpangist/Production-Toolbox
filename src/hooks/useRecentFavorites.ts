import { useCallback, useEffect, useState } from "react";
import {
  getFavoriteToolIds,
  getRecentToolIds,
  pushRecentToolId,
  toggleFavoriteToolId,
} from "../lib/db";

export function useRecentFavorites() {
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getRecentToolIds(), getFavoriteToolIds()]).then(([recent, favorites]) => {
      if (cancelled) return;
      setRecentIds(recent);
      setFavoriteIds(favorites);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const recordVisit = useCallback((id: string) => {
    void pushRecentToolId(id).then(setRecentIds);
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    void toggleFavoriteToolId(id).then(setFavoriteIds);
  }, []);

  return { recentIds, favoriteIds, loaded, recordVisit, toggleFavorite };
}
