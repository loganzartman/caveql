import { bindCompiledQuery, type ExecutionContext } from "../compiler";
import { readRecords } from "../data/readRecords";
import { impossible } from "../impossible";
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

  const input = data.input;
  switch (input.type) {
    case "iterable": {
      generator = run(input.value, context);
      break;
    }
    case "stream": {
      generator = run(readRecords(input), context);
      break;
    }
    default:
      impossible(input);
  }
}

async function getRecords(data: Extract<HostMessage, { type: "getRecords" }>) {
  if (!generator || !context) {
    throw new Error("Internal error: query not started");
  }

  let done = true;
  const records: Record<string, unknown>[] = [];
  let i = 0;
  for await (const result of generator) {
    records.push(result);
    i++;
    if (i >= data.max) {
      done = false;
      break;
    }
  }

  globalThis.postMessage({ type: "sendRecords", records, context, done });
}
