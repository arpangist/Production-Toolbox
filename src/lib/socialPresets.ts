export interface SocialPreset {
  label: string;
  width: number;
  height: number;
}

export interface SocialPlatform {
  name: string;
  presets: SocialPreset[];
}

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  {
    name: "Instagram",
    presets: [
      { label: "Square Post", width: 1080, height: 1080 },
      { label: "Portrait Post", width: 1080, height: 1350 },
      { label: "Story / Reel", width: 1080, height: 1920 },
    ],
  },
  {
    name: "TikTok",
    presets: [{ label: "Video / Cover", width: 1080, height: 1920 }],
  },
  {
    name: "YouTube",
    presets: [
      { label: "Thumbnail", width: 1280, height: 720 },
      { label: "Shorts", width: 1080, height: 1920 },
    ],
  },
  {
    name: "Facebook",
    presets: [
      { label: "Post", width: 1200, height: 630 },
      { label: "Cover", width: 820, height: 312 },
    ],
  },
  {
    name: "LinkedIn",
    presets: [
      { label: "Post", width: 1200, height: 1200 },
      { label: "Cover", width: 1584, height: 396 },
    ],
  },
  {
    name: "Pinterest",
    presets: [{ label: "Pin", width: 1000, height: 1500 }],
  },
  {
    name: "X / Twitter",
    presets: [{ label: "Post", width: 1200, height: 675 }],
  },
];
