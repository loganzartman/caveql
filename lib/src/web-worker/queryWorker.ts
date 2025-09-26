import { bindCompiledQuery, type ExecutionContext } from "../compiler";
import { readRecords } from "../data/readRecords";
import { impossible } from "../impossible";
import { iter } from "../iter";
import { type HostMessage, workerMessage } from "./message";

let iterator: AsyncIterator<Record<string, unknown>> | undefined;
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
  if (iterator) {
    throw new Error("Internal error: query already started");
  }

  const run = bindCompiledQuery(data.source);
  context = data.context;

  const input = data.input;
  switch (input.type) {
    case "iterable": {
      iterator = iter(run(input.value, context));
      break;
    }
    case "stream": {
      iterator = iter(run(readRecords(input), context));
      break;
    }
    default:
      impossible(input);
  }
}

async function getRecords(data: Extract<HostMessage, { type: "getRecords" }>) {
  if (!iterator || !context) {
    throw new Error("Internal error: query not started");
  }

  const startTime = Date.now();
  const records: Record<string, unknown>[] = [];

  let done = false;
  let i = 0;

  while (true) {
    const result = await iterator.next();
    if (result.done) {
      done = true;
      break;
    }

    records.push(result.value);
    if (++i >= data.maxCount || Date.now() - startTime >= data.maxTimeMs) {
      break;
    }
  }

  globalThis.postMessage(
    workerMessage({ type: "sendRecords", records, context, done }),
  );
}
