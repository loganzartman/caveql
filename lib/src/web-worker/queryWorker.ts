import { bindCompiledQuery, type ExecutionContext } from "../compiler";
import { impossible } from "../impossible";
import { asyncIter } from "../iter";
import type { HostMessage } from "./message";

let generator: AsyncIterable<Record<string, unknown>> | undefined;
let context: ExecutionContext | undefined;

globalThis.onmessage = ({ data }: MessageEvent<HostMessage>) => {
  switch (data.type) {
    case "startQuery":
      startQuery(data);
      break;
    case "getRecords":
      getRecords(data).catch(console.error);
      break;
    default:
      impossible(data);
  }
};

function startQuery(data: Extract<HostMessage, { type: "startQuery" }>) {
  if (generator) {
    throw new Error("Internal error: query already started");
  }

  const run = bindCompiledQuery(data.source);
  context = data.context;

  switch (data.input.type) {
    case "iterable": {
      const iterator = asyncIter(data.input.value);
      const asyncIterable = {
        [Symbol.asyncIterator]() {
          return iterator;
        },
      };
      generator = run(asyncIterable, context);
      break;
    }
    default:
      impossible(data.input.type);
  }
}

async function getRecords(data: Extract<HostMessage, { type: "getRecords" }>) {
  if (!generator || !context) {
    throw new Error("Internal error: query not started");
  }

  let done = true;
  const records: Record<string, unknown>[] = [];

  const i = 0;
  for await (const result of generator) {
    if (i > data.max) {
      done = false;
      break;
    }
    records.push(result);
  }

  globalThis.postMessage({ type: "sendRecords", records, context, done });
}
