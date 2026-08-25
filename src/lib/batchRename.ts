export interface RenameFields {
  project: string;
  client: string;
  date: string;
  pattern: string;
  numberStart: number;
  numberPadding: number;
}

function extensionOf(filename: string): string {
  const match = /\.[^./\\]+$/.exec(filename);
  return match ? match[0] : "";
}

function baseNameOf(filename: string): string {
  return filename.replace(/\.[^./\\]+$/, "");
}

export function buildFileName(originalName: string, index: number, fields: RenameFields, forcedExtension?: string): string {
  const number = String(fields.numberStart + index).padStart(fields.numberPadding, "0");
  const resolved = fields.pattern
    .replaceAll("{project}", fields.project || "project")
    .replaceAll("{client}", fields.client || "client")
    .replaceAll("{date}", fields.date)
    .replaceAll("{number}", number)
    .replaceAll("{original}", baseNameOf(originalName));

  const sanitized = resolved.replace(/[/\\?%*:|"<>]/g, "-").trim() || "file";
  return `${sanitized}${forcedExtension ?? extensionOf(originalName)}`;
}
