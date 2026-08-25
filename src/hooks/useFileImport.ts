import { useCallback, useState } from "react";
import { validateFiles, type FileValidationOptions } from "../lib/fileValidation";

export function useFileImport(options: FileValidationOptions) {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  const importFiles = useCallback(
    (incoming: File[] | FileList) => {
      const list = Array.from(incoming);
      const { accepted, rejected } = validateFiles(list, options);

      if (rejected.length > 0) {
        setError(rejected.map((entry) => entry.reason).join(" "));
      } else {
        setError(null);
      }

      if (accepted.length > 0) {
        setFiles((prev) => (options.multiple ? [...prev, ...accepted] : accepted));
      }
    },
    [options],
  );

  const reset = useCallback(() => {
    setFiles([]);
    setError(null);
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  return { files, error, importFiles, reset, removeFile };
}
