export const SCALE_RATIOS: { label: string; value: number }[] = [
  { label: "Minor Second", value: 1.067 },
  { label: "Major Second", value: 1.125 },
  { label: "Minor Third", value: 1.2 },
  { label: "Major Third", value: 1.25 },
  { label: "Perfect Fourth", value: 1.333 },
  { label: "Perfect Fifth", value: 1.5 },
  { label: "Golden Ratio", value: 1.618 },
];

const STEP_ORDER: { label: string; step: number }[] = [
  { label: "Display", step: 4 },
  { label: "H1", step: 3 },
  { label: "H2", step: 2 },
  { label: "H3", step: 1 },
  { label: "Body", step: 0 },
  { label: "Small", step: -1 },
  { label: "Caption", step: -2 },
];

export interface TypeStep {
  label: string;
  sizePx: number;
}

export function computeScale(basePx: number, ratio: number): TypeStep[] {
  return STEP_ORDER.map(({ label, step }) => ({ label, sizePx: basePx * Math.pow(ratio, step) }));
}

export function scaleToCss(steps: TypeStep[]): string {
  return `:root {\n${steps
    .map((s) => `  --font-size-${s.label.toLowerCase()}: ${s.sizePx.toFixed(2)}px;`)
    .join("\n")}\n}`;
}

export function scaleToJson(steps: TypeStep[]): string {
  return JSON.stringify(
    Object.fromEntries(steps.map((s) => [s.label.toLowerCase(), Math.round(s.sizePx * 100) / 100])),
    null,
    2,
  );
}

export function scaleToText(steps: TypeStep[]): string {
  return steps.map((s) => `${s.label.padEnd(8)} ${s.sizePx.toFixed(1)}px`).join("\n");
}
