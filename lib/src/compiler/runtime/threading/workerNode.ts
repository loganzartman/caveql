import { parentPort } from "node:worker_threads";
import { impossible } from "../../../impossible";
import { bindCompiledQuery } from "../../compileQuery";
import {
  type MapRecordsHostMessage,
  mapRecordsWorkerMessage,
} from "./messages";

let fn:
  | ((
      records: Record<string, unknown>[],
    ) => AsyncGenerator<Record<string, unknown>>)
  | undefined;

if (!parentPort) {
  throw new Error("parentPort is not available");
}

parentPort.on("message", (event: MapRecordsHostMessage) => {
  if (!parentPort) {
    throw new Error("parentPort is not available");
  }

  switch (event.type) {
    case "set-expression": {
      fn = bindCompiledQuery(event.expression);
      break;
    }
    case "map-records": {
      void mapRecords(event.records);
      break;
    }
    default:
      impossible(event);
  }
});

async function mapRecords(records: Record<string, unknown>[]) {
  if (!fn) {
    throw new Error("Function not set");
  }
  if (!parentPort) {
    throw new Error("parentPort is not available");
  }

  const it = fn(records);
  for await (const record of it) {
    parentPort.postMessage(
      mapRecordsWorkerMessage({ type: "return-records", records: [record] }),
    );
  }
}
