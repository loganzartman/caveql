import { bindCompiledQuery, type ExecutionContext } from "../compiler";
import { impossible } from "../impossible";
import type { HostMessage } from "./message";

let generator: Generator<Record<string, unknown>> | undefined;
let context: ExecutionContext | undefined;

globalThis.onmessage = ({ data }: MessageEvent<HostMessage>) => {
  switch (data.type) {
    case "startQuery":
      startQuery(data);
      break;
    case "getRecords":
      getRecords(data);
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
    case "iterable":
      generator = run(data.input.value, context);
      break;
    default:
      impossible(data.input.type);
  }
}

function getRecords(data: Extract<HostMessage, { type: "getRecords" }>) {
  if (!generator || !context) {
    throw new Error("Internal error: query not started");
  }

  let done = false;
  const records: Record<string, unknown>[] = [];

  for (let i = 0; i < data.max; ++i) {
    const result = generator.next();
    if (result.done) {
      done = true;
      break;
    }
    records.push(result.value);
  }

  globalThis.postMessage({ type: "sendRecords", records, context, done });
}
