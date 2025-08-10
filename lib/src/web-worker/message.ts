import type { ExecutionContext, QuerySource } from "../compiler";

export type HostMessage =
  | {
      type: "startQuery";
      source: QuerySource;
      input: WorkerRecordsInput;
      context: ExecutionContext;
    }
  | {
      type: "getRecords";
      max: number;
    };

// TODO: support streaming data in worker
export type WorkerRecordsInput = {
  type: "iterable";
  value: Iterable<Record<string, unknown>>;
};

export type WorkerMessage = {
  type: "sendRecords";
  records: Record<string, unknown>[];
  context: ExecutionContext;
  done: boolean;
};

export function hostMessage(payload: HostMessage): HostMessage {
  return payload;
}

export function workerMessage(payload: WorkerMessage): WorkerMessage {
  return payload;
}
