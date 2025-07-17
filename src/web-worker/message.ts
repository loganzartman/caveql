import type { QuerySource } from "../compiler";

export type HostMessage =
  | {
      type: "startQuery";
      source: QuerySource;
      input: WorkerRecordsInput;
    }
  | {
      type: "getRecords";
      timesliceMs: number;
    };

// TODO: support streaming data in worker
export type WorkerRecordsInput = {
  type: "iterable";
  value: Iterable<Record<string, unknown>>;
};

export type WorkerMessage = {
  type: "sendRecords";
  records: Record<string, unknown>[];
  done: boolean;
};

export function hostMessage(payload: HostMessage): HostMessage {
  return payload;
}

export function workerMessage(payload: WorkerMessage): WorkerMessage {
  return payload;
}
