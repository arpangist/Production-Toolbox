export type CheckStatus = "pass" | "warning" | "fail" | "skip";

export interface CheckItem {
  label: string;
  status: CheckStatus;
  detail: string;
}

export interface PreflightRequirements {
  targetWidth: number | null;
  targetHeight: number | null;
  minWidth: number | null;
  minHeight: number | null;
  allowedTypes: string[];
  maxSizeBytes: number | null;
  transparency: "any" | "required" | "disallowed";
}

export interface ImageInfo {
  width: number;
  height: number;
  type: string;
  size: number;
  hasTransparency: boolean;
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

export function ratioLabel(width: number, height: number): string {
  const divisor = gcd(width, height) || 1;
  return `${width / divisor}:${height / divisor}`;
}

export function runPreflight(info: ImageInfo, req: PreflightRequirements): CheckItem[] {
  const checks: CheckItem[] = [];

  if (req.targetWidth && req.targetHeight) {
    const matches = info.width === req.targetWidth && info.height === req.targetHeight;
    checks.push({
      label: "Dimensions",
      status: matches ? "pass" : "fail",
      detail: matches
        ? `${info.width}×${info.height}`
        : `${info.width}×${info.height} (expected ${req.targetWidth}×${req.targetHeight})`,
    });

    const actualRatio = info.width / info.height;
    const targetRatio = req.targetWidth / req.targetHeight;
    const ratioMatches = Math.abs(actualRatio - targetRatio) < 0.01;
    checks.push({
      label: "Aspect Ratio",
      status: ratioMatches ? "pass" : "fail",
      detail: ratioMatches
        ? ratioLabel(info.width, info.height)
        : `${ratioLabel(info.width, info.height)} (expected ${ratioLabel(req.targetWidth, req.targetHeight)})`,
    });
  } else {
    checks.push({ label: "Dimensions", status: "skip", detail: `${info.width}×${info.height} — no target set` });
    checks.push({ label: "Aspect Ratio", status: "skip", detail: `${ratioLabel(info.width, info.height)} — no target set` });
  }

  if (req.minWidth || req.minHeight) {
    const meets = info.width >= (req.minWidth ?? 0) && info.height >= (req.minHeight ?? 0);
    checks.push({
      label: "Resolution",
      status: meets ? "pass" : "fail",
      detail: meets
        ? `${info.width}×${info.height} meets minimum`
        : `${info.width}×${info.height} is below the ${req.minWidth ?? 0}×${req.minHeight ?? 0} minimum`,
    });
  } else {
    checks.push({ label: "Resolution", status: "skip", detail: "No minimum set" });
  }

  if (req.allowedTypes.length > 0) {
    const allowed = req.allowedTypes.includes(info.type);
    checks.push({
      label: "File Type",
      status: allowed ? "pass" : "fail",
      detail: allowed ? info.type : `${info.type} is not in the allowed list`,
    });
  } else {
    checks.push({ label: "File Type", status: "skip", detail: info.type });
  }

  if (req.maxSizeBytes) {
    const withinLimit = info.size <= req.maxSizeBytes;
    checks.push({
      label: "File Size",
      status: withinLimit ? "pass" : "fail",
      detail: withinLimit ? "Within limit" : "Exceeds the configured maximum",
    });
  } else {
    checks.push({ label: "File Size", status: "skip", detail: "No limit set" });
  }

  checks.push({
    label: "Safe Area",
    status: "warning",
    detail: "Not automatically checked — verify manually or use the Safe Zone tool",
  });

  if (req.transparency !== "any") {
    const required = req.transparency === "required";
    const ok = info.hasTransparency === required;
    checks.push({
      label: "Transparency",
      status: ok ? "pass" : "fail",
      detail: info.hasTransparency ? "Image has transparency" : "Image has no transparency",
    });
  } else {
    checks.push({
      label: "Transparency",
      status: "skip",
      detail: info.hasTransparency ? "Has transparency" : "No transparency",
    });
  }

  return checks;
}
