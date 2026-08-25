/// <reference lib="webworker" />
import type { WorkerInboundMessage, WorkerOutboundMessage } from "./types";

export interface ChecksumResult {
  hash: string;
  size: number;
  type: string;
}

function post(message: WorkerOutboundMessage<ChecksumResult>) {
  (self as unknown as Worker).postMessage(message);
}

self.onmessage = async (event: MessageEvent<WorkerInboundMessage<File>>) => {
  const { taskId, payload: file } = event.data;
  try {
    post({ kind: "progress", taskId, progress: 0.1 });
    const buffer = await file.arrayBuffer();
    post({ kind: "progress", taskId, progress: 0.6 });
    const digest = await crypto.subtle.digest("SHA-256", buffer);
    const hash = Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
    post({ kind: "progress", taskId, progress: 1 });
    post({ kind: "result", taskId, result: { hash, size: file.size, type: file.type } });
  } catch (error) {
    post({ kind: "error", taskId, message: error instanceof Error ? error.message : "Unknown worker error" });
  }
};
