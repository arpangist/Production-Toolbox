import { useCallback, useEffect, useState } from "react";
import { getBrandRules, setBrandRules } from "../lib/db";
import { DEFAULT_BRAND_RULES, type BrandRules } from "../lib/brand";

export function useBrandRules() {
  const [rules, setRulesState] = useState<BrandRules>(DEFAULT_BRAND_RULES);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getBrandRules().then((r) => {
      if (cancelled) return;
      setRulesState(r);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const setRules = useCallback((next: BrandRules) => {
    setRulesState(next);
    void setBrandRules(next);
  }, []);

  return { rules, setRules, loaded };
}
