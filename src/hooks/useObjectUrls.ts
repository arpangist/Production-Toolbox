import { useEffect, useState } from "react";
import { objectUrlManager } from "../lib/objectUrlManager";

/** Creates tracked object URLs for a list of files and revokes the whole
 * batch when the list changes or the component unmounts. */
export function useObjectUrls(files: File[]): Map<File, string> {
  const [urls, setUrls] = useState<Map<File, string>>(new Map());

  useEffect(() => {
    const next = new Map<File, string>();
    for (const file of files) next.set(file, objectUrlManager.create(file));
    setUrls(next);
    return () => {
      for (const url of next.values()) objectUrlManager.revoke(url);
    };
  }, [files]);

  return urls;
}
