import { useEffect, useState } from "react";
import { objectUrlManager } from "../lib/objectUrlManager";

/** Creates a tracked object URL for a Blob/File and revokes it automatically
 * when the source changes or the component unmounts. */
export function useObjectUrl(source: Blob | null): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!source) {
      setUrl(null);
      return;
    }
    const objectUrl = objectUrlManager.create(source);
    setUrl(objectUrl);
    return () => objectUrlManager.revoke(objectUrl);
  }, [source]);

  return url;
}
