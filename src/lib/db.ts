import { createStore, get, set } from "idb-keyval";
import { DEFAULT_BRAND_RULES, EMPTY_BRAND_PROFILE, type BrandProfile, type BrandRules } from "./brand";
import type { ExportPreset } from "./exportPresets";

// Single dedicated IndexedDB store for app preferences. Never used to
// persist user media — only small preference/preset records.
const store = createStore("creative-toolbox", "preferences");

const KEYS = {
  recentTools: "recentTools",
  favoriteTools: "favoriteTools",
  brandProfile: "brandProfile",
  brandRules: "brandRules",
  exportPresets: "exportPresets",
} as const;

const MAX_RECENT = 8;

export async function getRecentToolIds(): Promise<string[]> {
  return (await get<string[]>(KEYS.recentTools, store)) ?? [];
}

export async function pushRecentToolId(id: string): Promise<string[]> {
  const current = await getRecentToolIds();
  const next = [id, ...current.filter((existing) => existing !== id)].slice(0, MAX_RECENT);
  await set(KEYS.recentTools, next, store);
  return next;
}

export async function getFavoriteToolIds(): Promise<string[]> {
  return (await get<string[]>(KEYS.favoriteTools, store)) ?? [];
}

export async function toggleFavoriteToolId(id: string): Promise<string[]> {
  const current = await getFavoriteToolIds();
  const next = current.includes(id)
    ? current.filter((existing) => existing !== id)
    : [...current, id];
  await set(KEYS.favoriteTools, next, store);
  return next;
}

export async function getBrandProfile(): Promise<BrandProfile> {
  return (await get<BrandProfile>(KEYS.brandProfile, store)) ?? EMPTY_BRAND_PROFILE;
}

export async function setBrandProfile(profile: BrandProfile): Promise<void> {
  await set(KEYS.brandProfile, profile, store);
}

export async function getBrandRules(): Promise<BrandRules> {
  return (await get<BrandRules>(KEYS.brandRules, store)) ?? DEFAULT_BRAND_RULES;
}

export async function setBrandRules(rules: BrandRules): Promise<void> {
  await set(KEYS.brandRules, rules, store);
}

export async function getExportPresets(): Promise<ExportPreset[]> {
  return (await get<ExportPreset[]>(KEYS.exportPresets, store)) ?? [];
}

export async function setExportPresets(presets: ExportPreset[]): Promise<void> {
  await set(KEYS.exportPresets, presets, store);
}
