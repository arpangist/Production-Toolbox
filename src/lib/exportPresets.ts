export interface ExportPreset {
  id: string;
  name: string;
  width: number;
  height: number;
  fps: number; // 0 = not applicable (still-image preset)
  format: string;
  notes: string;
}

let idCounter = 0;
export function nextPresetId(): string {
  idCounter += 1;
  return `export-preset-${idCounter}-${Date.now()}`;
}
