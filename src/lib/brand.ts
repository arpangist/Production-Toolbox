export interface BrandColor {
  id: string;
  name: string;
  hex: string;
}

export interface BrandProfile {
  name: string;
  colors: BrandColor[];
}

export const EMPTY_BRAND_PROFILE: BrandProfile = { name: "My Brand", colors: [] };

export interface BrandRules {
  approvedColorHexes: string[];
  approvedFont: string;
  maxLogoWidth: number;
  colorTolerance: number; // 0-100, allowed channel drift when matching
}

export const DEFAULT_BRAND_RULES: BrandRules = {
  approvedColorHexes: [],
  approvedFont: "",
  maxLogoWidth: 240,
  colorTolerance: 10,
};

let idCounter = 0;
export function nextBrandColorId(): string {
  idCounter += 1;
  return `brand-color-${idCounter}-${Date.now()}`;
}
