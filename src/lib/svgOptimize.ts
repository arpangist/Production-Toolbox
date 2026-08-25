export interface SvgOptimizeOptions {
  removeComments: boolean;
  removeMetadata: boolean;
  removeEditorAttrs: boolean;
  collapseWhitespace: boolean;
  roundPrecision: number; // decimal places, -1 disables
}

export const DEFAULT_SVG_OPTIONS: SvgOptimizeOptions = {
  removeComments: true,
  removeMetadata: true,
  removeEditorAttrs: true,
  collapseWhitespace: true,
  roundPrecision: 2,
};

/** Text-level SVG optimizations only — no DOM parsing, so structure the
 * author actually wrote (paths, gradients, transforms) is never rewritten,
 * only trimmed. Safe to run on any well-formed SVG. */
export function optimizeSvg(source: string, options: SvgOptimizeOptions): string {
  // The XML declaration (e.g. `<?xml version="1.0" ...?>`) must be pulled
  // out first — the numeric-precision pass below would otherwise round
  // "1.0" down to "1", producing an invalid `version="1"` declaration that
  // browsers refuse to parse at all.
  const declarationMatch = /^\s*<\?xml[^?]*\?>\s*/.exec(source);
  const declaration = declarationMatch ? declarationMatch[0].trim() : "";
  let result = declarationMatch ? source.slice(declarationMatch[0].length) : source;

  if (options.removeComments) {
    result = result.replace(/<!--[\s\S]*?-->/g, "");
  }

  if (options.removeMetadata) {
    result = result.replace(/<metadata[\s\S]*?<\/metadata>/gi, "");
    result = result.replace(/<title[\s\S]*?<\/title>/gi, "");
    result = result.replace(/<desc[\s\S]*?<\/desc>/gi, "");
  }

  if (options.removeEditorAttrs) {
    result = result.replace(/\s+(inkscape|sodipodi):[\w-]+="[^"]*"/g, "");
    result = result.replace(/\s+xmlns:(inkscape|sodipodi)="[^"]*"/g, "");
  }

  if (options.roundPrecision >= 0) {
    result = result.replace(/-?\d+\.\d+/g, (match) => {
      const rounded = Number(match).toFixed(options.roundPrecision);
      return String(Number(rounded));
    });
  }

  // Empty attributes left behind by the removals above.
  result = result.replace(/\s+[\w-]+=""/g, "");

  if (options.collapseWhitespace) {
    result = result.replace(/>\s+</g, "><").trim();
  }

  return declaration ? `${declaration}${result}` : result;
}

export function byteSize(text: string): number {
  return new TextEncoder().encode(text).length;
}
