import { useCallback, useEffect, useState } from "react";
import { getBrandProfile, setBrandProfile } from "../lib/db";
import { EMPTY_BRAND_PROFILE, type BrandProfile } from "../lib/brand";

export function useBrandProfile() {
  const [profile, setProfileState] = useState<BrandProfile>(EMPTY_BRAND_PROFILE);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getBrandProfile().then((p) => {
      if (cancelled) return;
      setProfileState(p);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const setProfile = useCallback((next: BrandProfile) => {
    setProfileState(next);
    void setBrandProfile(next);
  }, []);

  return { profile, setProfile, loaded };
}
