import { useEffect, useState } from "react";

export interface ImageDimensions {
  width: number;
  height: number;
}

export function useImageDimensions(file: File | null): ImageDimensions | null {
  const [dimensions, setDimensions] = useState<ImageDimensions | null>(null);

  useEffect(() => {
    if (!file) {
      setDimensions(null);
      return;
    }

    const url = URL.createObjectURL(file);
    const image = new Image();
    let cancelled = false;

    image.onload = () => {
      if (!cancelled) setDimensions({ width: image.naturalWidth, height: image.naturalHeight });
      URL.revokeObjectURL(url);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
    };
    image.src = url;

    return () => {
      cancelled = true;
      URL.revokeObjectURL(url);
    };
  }, [file]);

  return dimensions;
}
