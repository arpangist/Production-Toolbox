export interface WorkerInboundMessage<TPayload = unknown> {
  taskId: string;
  payload: TPayload;
}

export type WorkerOutboundMessage<TResult = unknown> =
  | { kind: "progress"; taskId: string; progress: number }
  | { kind: "result"; taskId: string; result: TResult }
  | { kind: "error"; taskId: string; message: string };
