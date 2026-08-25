export interface FileValidationOptions {
  acceptedTypes?: string[];
  maxSizeBytes?: number;
  multiple?: boolean;
}

export interface FileValidationResult {
  accepted: File[];
  rejected: { file: File; reason: string }[];
}

function matchesAccept(file: File, acceptedTypes: string[]): boolean {
  return acceptedTypes.some((pattern) => {
    if (pattern.endsWith("/*")) return file.type.startsWith(pattern.slice(0, -1));
    if (pattern.startsWith(".")) return file.name.toLowerCase().endsWith(pattern.toLowerCase());
    return file.type === pattern;
  });
}

export function validateFiles(
  files: File[],
  { acceptedTypes, maxSizeBytes, multiple = true }: FileValidationOptions,
): FileValidationResult {
  const list = multiple ? files : files.slice(0, 1);
  const accepted: File[] = [];
  const rejected: FileValidationResult["rejected"] = [];

  for (const file of list) {
    if (acceptedTypes && acceptedTypes.length > 0 && !matchesAccept(file, acceptedTypes)) {
      rejected.push({ file, reason: `${file.name} isn't a supported file type.` });
      continue;
    }
    if (maxSizeBytes && file.size > maxSizeBytes) {
      rejected.push({ file, reason: `${file.name} is larger than the allowed size.` });
      continue;
    }
    accepted.push(file);
  }

  return { accepted, rejected };
}
