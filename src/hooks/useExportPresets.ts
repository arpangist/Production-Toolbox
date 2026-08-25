import { useCallback, useEffect, useState } from "react";
import { getExportPresets, setExportPresets } from "../lib/db";
import type { ExportPreset } from "../lib/exportPresets";

export function useExportPresets() {
  const [presets, setPresetsState] = useState<ExportPreset[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getExportPresets().then((p) => {
      if (cancelled) return;
      setPresetsState(p);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const setPresets = useCallback((next: ExportPreset[]) => {
    setPresetsState(next);
    void setExportPresets(next);
  }, []);

  return { presets, setPresets, loaded };
}
