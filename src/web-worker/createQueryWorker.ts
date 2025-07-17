import { AsyncEmitter } from "../AsyncEmitter";
import { compileQueryRaw } from "../compiler";
import { impossible } from "../impossible";
import type { QueryAST } from "../parser";
import {
  hostMessage,
  type WorkerMessage,
  type WorkerRecordsInput,
} from "./message";

export type QueryWorker = {
  query(input: WorkerRecordsInput): AsyncQueryHandle;
  readonly activeQueries: Set<AsyncQueryHandle>;
  readonly source: string;
};

export type AsyncQueryHandle = {
  records: AsyncIterable<Record<string, unknown>>;
  cancel(): void;
};

export function createQueryWorker(ast: QueryAST): QueryWorker {
  // TODO: compile in a worker? most queries probably are not large.
  const source = compileQueryRaw(ast);

  const timesliceMs = 10;
  const activeQueries = new Set<AsyncQueryHandle>();

  const query = (input: WorkerRecordsInput) => {
    const worker = new Worker(new URL("./queryWorker.ts", import.meta.url), {
      type: "module",
    });

    const bufferedRecords: Record<string, unknown>[] = [];
    const newRecords = new AsyncEmitter<void>();
    let done = false;

    const handle = {} as AsyncQueryHandle;

    const records = (async function* () {
      while (!done) {
        if (!bufferedRecords.length) {
          worker.postMessage(hostMessage({ type: "getRecords", timesliceMs }));
          await newRecords.wait();
        }
        while (bufferedRecords.length) {
          // biome-ignore lint/style/noNonNullAssertion: length checked
          yield bufferedRecords.shift()!;
        }
      }
      worker.terminate();
      activeQueries.delete(handle);
    })();
    handle.records = records;

    const cancel = () => {
      worker.terminate();
      records.return();
      activeQueries.delete(handle);
    };
    handle.cancel = cancel;

    worker.addEventListener(
      "message",
      ({ data }: MessageEvent<WorkerMessage>) => {
        console.log("worker message", data);
        switch (data.type) {
          case "sendRecords":
            Array.prototype.push.apply(bufferedRecords, data.records);
            done = data.done;
            newRecords.emit();
            break;
          default:
            impossible(data.type);
        }
      },
    );

    worker.postMessage(
      hostMessage({
        type: "startQuery",
        source,
        input,
      }),
    );

    activeQueries.add(handle);
    return handle;
  };

  return {
    query,
    activeQueries,
    source,
  };
}
