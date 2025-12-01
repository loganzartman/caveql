import { AsyncFlag } from "../AsyncFlag";
import { bindCompiledQuery, type ExecutionContext } from "../compiler";
import { readRecords } from "../data/readRecords";
import { impossible } from "../impossible";
import { iter } from "../iter";
import { type HostMessage, workerMessage } from "./message";

let state:
  | {
      iterator: AsyncIterator<Record<string, unknown>>;
      context: ExecutionContext;
      interval: ReturnType<typeof setInterval>;
      running: AsyncFlag;
      done: boolean;
      stopCount: number;
    }
  | undefined;

globalThis.onmessage = ({ data }: MessageEvent<HostMessage>) => {
  switch (data.type) {
    case "startQuery":
      startQuery(data);
      break;
    case "loadMore":
      if (!state) {
        throw new Error("Internal error: query not started");
      }
      state.stopCount += data.limit;
      state.running.set(true);
      break;
    default:
      impossible(data);
  }
};

function startQuery(data: Extract<HostMessage, { type: "startQuery" }>) {
  if (state) {
    throw new Error("Internal error: query already started");
  }

  const run = bindCompiledQuery(data.source);

  const iterator = (() => {
    switch (data.input.type) {
      case "iterable": {
        return iter(run(data.input.value, data.context));
      }
      case "stream": {
        return iter(run(readRecords(data.input, data.context), data.context));
      }
      default:
        impossible(data.input);
    }
  })();

  const records: Record<string, unknown>[] = [];
  const flush = ({ limited }: { limited: boolean }) => {
    if (!state) {
      throw new Error("Internal error: query not started");
    }
    const { bytesRead, bytesTotal } = state.context;
    globalThis.postMessage(
      workerMessage({
        type: "sendRecords",
        records,
        context: state.context,
        progress: bytesTotal != null ? bytesRead / bytesTotal : "indeterminate",
        done: state.done,
        limited,
      }),
    );
    records.length = 0;
  };

  const interval = setInterval(() => {
    if (state?.running && !state.done) {
      flush({ limited: false });
    }
  }, data.maxIntervalMs);

  state = {
    iterator,
    context: data.context,
    interval,
    running: new AsyncFlag(true),
    done: false,
    stopCount: data.limit,
  };

  (async () => {
    let i = 0;
    let iChunk = 0;

    while (true) {
      await state.running.wait();
      const result = await iterator.next();
      if (result.done) {
        break;
      }

      records.push(result.value);

      iChunk++;
      i++;

      if (i >= state.stopCount) {
        state.running.set(false);
        flush({ limited: true });
      } else if (iChunk >= data.maxChunkSize) {
        iChunk = 0;
        flush({ limited: false });
      }
    }

    state.done = true;
    flush({ limited: false });
    clearInterval(state.interval);
  })().catch((error) => {
    console.error(error);
  });
}
