import type { WorkerOutboundMessage } from "./types";

export interface WorkerTaskHandle<TResult> {
  promise: Promise<TResult>;
  cancel: () => void;
}

interface QueueItem {
  taskId: string;
  payload: unknown;
  transfer: Transferable[];
  onProgress?: (progress: number) => void;
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
  cancelled: boolean;
}

interface PoolWorker {
  worker: Worker;
  busy: boolean;
  currentTaskId: string | null;
}

/**
 * A small pool of reusable Web Workers so heavy processing (image, video,
 * hashing) never blocks the main UI thread. Tasks queue when every worker
 * is busy; cancelling a running task terminates and respawns its worker
 * since a Worker has no way to abort mid-computation otherwise.
 */
export class WorkerPool {
  private readonly factory: () => Worker;
  private readonly size: number;
  private workers: PoolWorker[] = [];
  private queue: QueueItem[] = [];
  private activeItems = new Map<string, QueueItem>();
  private taskCounter = 0;

  constructor(factory: () => Worker, size = Math.max(1, Math.min(4, navigator.hardwareConcurrency || 2))) {
    this.factory = factory;
    this.size = size;
  }

  run<TResult>(
    payload: unknown,
    options: { transfer?: Transferable[]; onProgress?: (progress: number) => void } = {},
  ): WorkerTaskHandle<TResult> {
    const taskId = `task-${++this.taskCounter}`;
    let item!: QueueItem;
    const promise = new Promise<TResult>((resolve, reject) => {
      item = {
        taskId,
        payload,
        transfer: options.transfer ?? [],
        onProgress: options.onProgress,
        resolve: resolve as (value: unknown) => void,
        reject,
        cancelled: false,
      };
      this.queue.push(item);
      this.drain();
    });

    return {
      promise,
      cancel: () => {
        item.cancelled = true;
        const entry = this.workers.find((w) => w.currentTaskId === taskId);
        if (!entry) return;
        entry.worker.terminate();
        this.workers.splice(this.workers.indexOf(entry), 1);
        this.activeItems.delete(taskId);
        item.reject(new Error("Cancelled"));
        this.drain();
      },
    };
  }

  dispose(): void {
    for (const entry of this.workers) entry.worker.terminate();
    this.workers = [];
    this.queue = [];
    this.activeItems.clear();
  }

  private spawn(): PoolWorker {
    const worker = this.factory();
    const entry: PoolWorker = { worker, busy: false, currentTaskId: null };
    worker.addEventListener("message", (event: MessageEvent<WorkerOutboundMessage>) =>
      this.handleMessage(entry, event.data),
    );
    worker.addEventListener("error", (event) => this.handleError(entry, event));
    return entry;
  }

  private handleMessage(entry: PoolWorker, message: WorkerOutboundMessage): void {
    const item = this.activeItems.get(message.taskId);
    if (!item) return;

    if (message.kind === "progress") {
      item.onProgress?.(message.progress);
      return;
    }

    this.settle(entry, item, () => {
      if (message.kind === "result") item.resolve(message.result);
      else item.reject(new Error(message.message));
    });
  }

  private handleError(entry: PoolWorker, event: ErrorEvent): void {
    const taskId = entry.currentTaskId;
    if (!taskId) return;
    const item = this.activeItems.get(taskId);
    if (!item) return;
    this.settle(entry, item, () => item.reject(new Error(event.message || "Worker error")));
  }

  private settle(entry: PoolWorker, item: QueueItem, run: () => void): void {
    this.activeItems.delete(item.taskId);
    entry.busy = false;
    entry.currentTaskId = null;
    if (!item.cancelled) run();
    this.drain();
  }

  private drain(): void {
    if (this.queue.length === 0) return;

    let entry = this.workers.find((w) => !w.busy);
    if (!entry && this.workers.length < this.size) {
      entry = this.spawn();
      this.workers.push(entry);
    }
    if (!entry) return;

    let item = this.queue.shift();
    while (item?.cancelled) item = this.queue.shift();
    if (!item) return;

    entry.busy = true;
    entry.currentTaskId = item.taskId;
    this.activeItems.set(item.taskId, item);
    entry.worker.postMessage({ taskId: item.taskId, payload: item.payload }, item.transfer);
  }
}
