import { useEffect } from "react";

/**
 * Registers a document-level keydown handler for a single key, optionally
 * requiring Cmd (macOS) or Ctrl (everyone else). Used for ⌘/Ctrl+K and Esc.
 */
export function useGlobalHotkey(
  key: string,
  handler: (event: KeyboardEvent) => void,
  options: { meta?: boolean } = {},
) {
  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== key.toLowerCase()) return;
      if (options.meta && !(event.metaKey || event.ctrlKey)) return;
      if (!options.meta && (event.metaKey || event.ctrlKey)) return;
      handler(event);
    };
    document.addEventListener("keydown", listener);
    return () => document.removeEventListener("keydown", listener);
  }, [key, handler, options.meta]);
}
