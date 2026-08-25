import { useCallback, useEffect, useRef } from "react";
import { WorkerPool } from "../workers/workerPool";
import type { ImageWorkerPayload } from "../workers/imageProcessing.types";

export function useImageProcessor() {
  const poolRef = useRef<WorkerPool | null>(null);

  const getPool = useCallback(() => {
    if (!poolRef.current) {
      poolRef.current = new WorkerPool(
        () => new Worker(new URL("../workers/imageProcessing.worker.ts", import.meta.url), { type: "module" }),
      );
    }
    return poolRef.current;
  }, []);

  useEffect(() => {
    return () => poolRef.current?.dispose();
  }, []);

  const run = useCallback(
    <TResult>(payload: ImageWorkerPayload, onProgress?: (progress: number) => void) =>
      getPool().run<TResult>(payload, { onProgress }),
    [getPool],
  );

  return { run };
}
