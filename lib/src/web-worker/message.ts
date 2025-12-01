import type { ExecutionContext, QuerySource } from "../compiler";
import type { SourceFormat } from "../data/readRecords";

export type HostMessage =
  | {
      type: "startQuery";
      source: QuerySource;
      input: WorkerRecordsInput;
      context: ExecutionContext;
      limit: number;
      maxChunkSize: number;
      maxIntervalMs: number;
    }
  | {
      type: "loadMore";
      limit: number;
    };

export type WorkerRecordsInput =
  | {
      type: "iterable";
      value:
        | Iterable<Record<string, unknown>>
        | AsyncIterable<Record<string, unknown>>;
    }
  | {
      type: "stream";
      stream: ReadableStream<Uint8Array>;
      format: SourceFormat;
    };

export type WorkerMessage = {
  type: "sendRecords";
  records: Record<string, unknown>[];
  context: ExecutionContext;
  done: boolean;
  limited: boolean;
};

export function hostMessage(payload: HostMessage): HostMessage {
  return payload;
}

export function workerMessage(payload: WorkerMessage): WorkerMessage {
  return payload;
}
