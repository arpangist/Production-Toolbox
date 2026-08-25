export interface SafeZoneGuide {
  label: string;
  top: number;
  right: number;
  bottom: number;
  left: number;
  color: string;
}

export interface SafeZonePreset {
  name: string;
  guides: SafeZoneGuide[];
}

export const SAFE_ZONE_PRESETS: SafeZonePreset[] = [
  {
    name: "General Broadcast",
    guides: [
      { label: "Action Safe · 90%", top: 5, right: 5, bottom: 5, left: 5, color: "#ffe66d" },
      { label: "Title Safe · 80%", top: 10, right: 10, bottom: 10, left: 10, color: "#ff6b6b" },
    ],
  },
  {
    name: "Instagram / TikTok Reels",
    guides: [{ label: "UI Safe Area", top: 14, right: 6, bottom: 20, left: 6, color: "#4ecdc4" }],
  },
  {
    name: "YouTube Shorts",
    guides: [{ label: "UI Safe Area", top: 12, right: 8, bottom: 18, left: 8, color: "#4ecdc4" }],
  },
];
