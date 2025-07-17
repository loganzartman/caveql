import { bindCompiledQuery } from "../compiler";
import { impossible } from "../impossible";
import type { HostMessage } from "./message";

let generator: Generator<Record<string, unknown>> | undefined;

console.log("queryWorker created");

globalThis.onmessage = ({ data }: MessageEvent<HostMessage>) => {
  console.log("host message", data);
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

  switch (data.input.type) {
    case "iterable":
      generator = run(data.input.value);
      break;
    default:
      impossible(data.input.type);
  }
}

function getRecords(data: Extract<HostMessage, { type: "getRecords" }>) {
  if (!generator) {
    throw new Error("Internal error: query not started");
  }

  let done = false;
  const records: Record<string, unknown>[] = [];
  const t0 = performance.now();

  do {
    const result = generator.next();
    if (result.done) {
      done = true;
      break;
    }
    records.push(result.value);
  } while (performance.now() - t0 < data.timesliceMs);

  globalThis.postMessage({ type: "sendRecords", records, done });
}
