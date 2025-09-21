import { AsyncQueue } from "../AsyncQueue";
import {
  compileQueryRaw,
  createExecutionContext,
  type ExecutionContext,
} from "../compiler";
import { impossible } from "../impossible";
import type { QueryAST } from "../parser";
import {
  hostMessage,
  type WorkerMessage,
  type WorkerRecordsInput,
} from "./message";

export type QueryWorker = {
  query(
    input: WorkerRecordsInput,
    context?: ExecutionContext,
  ): AsyncQueryHandle;
  readonly activeQueries: Set<AsyncQueryHandle>;
  readonly source: string;
};

export type ContextHandler = (params: { context: ExecutionContext }) => void;
export type Off = () => void;

export type AsyncQueryHandle = {
  records: AsyncIterable<Record<string, unknown>>;
  onContext(callback: ContextHandler): Off;
  cancel(): void;
};

export function createQueryWorker(ast: QueryAST): QueryWorker {
  // TODO: compile in a worker? most queries probably are not large.
  const source = compileQueryRaw(ast);

  const max = 1000;
  const activeQueries = new Set<AsyncQueryHandle>();

  const query = (
    input: WorkerRecordsInput,
    context: ExecutionContext = createExecutionContext(),
  ) => {
    const worker = new Worker(new URL("./queryWorker.ts", import.meta.url), {
      type: "module",
    });

    const bufferedRecords = new AsyncQueue<Record<string, unknown>>();
    let done = false;

    const contextHandlers = new Set<ContextHandler>();
    const handle = {
      onContext(callback) {
        contextHandlers.add(callback);
        return () => {
          contextHandlers.delete(callback);
        };
      },
    } as AsyncQueryHandle;

    const records = (async function* () {
      while (!done) {
        worker.postMessage(hostMessage({ type: "getRecords", max }));
        await bufferedRecords.wait();

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
      bufferedRecords.unblock();
      activeQueries.delete(handle);
    };
    handle.cancel = cancel;

    worker.addEventListener(
      "message",
      ({ data }: MessageEvent<WorkerMessage>) => {
        switch (data.type) {
          case "sendRecords":
            bufferedRecords.pushAll(data.records);
            contextHandlers.forEach((cb) => cb({ context: data.context }));
            done = data.done;
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
        context,
      }),
      input.type === "stream" ? [input.stream] : [],
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
