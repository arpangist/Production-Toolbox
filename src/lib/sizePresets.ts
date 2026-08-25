export interface SizePreset {
  label: string;
  width: number;
  height: number;
}

export const SIZE_PRESETS: SizePreset[] = [
  { label: "Instagram Square", width: 1080, height: 1080 },
  { label: "Instagram Portrait", width: 1080, height: 1350 },
  { label: "Instagram Story / Reel", width: 1080, height: 1920 },
  { label: "TikTok", width: 1080, height: 1920 },
  { label: "X / Twitter Post", width: 1200, height: 675 },
  { label: "YouTube Thumbnail", width: 1280, height: 720 },
  { label: "Facebook Cover", width: 820, height: 312 },
  { label: "LinkedIn Post", width: 1200, height: 1200 },
  { label: "Pinterest Pin", width: 1000, height: 1500 },
];
