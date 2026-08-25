import type { BorderStyle } from "../workers/imageProcessing.types";

export interface FrameSettings {
  outerPadding: number;
  innerPadding: number;
  borderWidth: number;
  borderColor: string;
  borderStyle: BorderStyle;
  cornerRadius: number;
  shadow: boolean;
  backgroundColor: string;
  transparentBackground: boolean;
}

export interface FramePreset extends FrameSettings {
  label: string;
}

export const FRAME_PRESETS: FramePreset[] = [
  {
    label: "Minimal",
    outerPadding: 24,
    innerPadding: 0,
    borderWidth: 0,
    borderColor: "#111111",
    borderStyle: "solid",
    cornerRadius: 0,
    shadow: false,
    backgroundColor: "#ffffff",
    transparentBackground: false,
  },
  {
    label: "Polaroid",
    outerPadding: 32,
    innerPadding: 0,
    borderWidth: 0,
    borderColor: "#111111",
    borderStyle: "solid",
    cornerRadius: 0,
    shadow: true,
    backgroundColor: "#ffffff",
    transparentBackground: false,
  },
  {
    label: "Film Frame",
    outerPadding: 16,
    innerPadding: 0,
    borderWidth: 8,
    borderColor: "#111111",
    borderStyle: "solid",
    cornerRadius: 0,
    shadow: false,
    backgroundColor: "#111111",
    transparentBackground: false,
  },
  {
    label: "Editorial",
    outerPadding: 48,
    innerPadding: 0,
    borderWidth: 1,
    borderColor: "#cfcfcc",
    borderStyle: "solid",
    cornerRadius: 0,
    shadow: false,
    backgroundColor: "#f7f7f5",
    transparentBackground: false,
  },
  {
    label: "Gallery",
    outerPadding: 40,
    innerPadding: 0,
    borderWidth: 2,
    borderColor: "#111111",
    borderStyle: "solid",
    cornerRadius: 0,
    shadow: true,
    backgroundColor: "#ffffff",
    transparentBackground: false,
  },
  {
    label: "Social",
    outerPadding: 20,
    innerPadding: 0,
    borderWidth: 0,
    borderColor: "#111111",
    borderStyle: "solid",
    cornerRadius: 16,
    shadow: true,
    backgroundColor: "#ffffff",
    transparentBackground: false,
  },
];
