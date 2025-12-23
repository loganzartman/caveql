import { impossible } from "../../../impossible";
import { AsyncGeneratorFunction } from "../../AsyncGeneratorFunction";
import {
  type MapRecordsHostMessage,
  mapRecordsWorkerMessage,
} from "./messages";

let fn:
  | ((
      records: Record<string, unknown>[],
    ) => AsyncGenerator<Record<string, unknown>>)
  | undefined;

globalThis.onmessage = (event: MessageEvent<MapRecordsHostMessage>) => {
  switch (event.data.type) {
    case "set-fn": {
      const yieldCallExpression = `yield* (${event.data.functionExpression})(records);`;
      fn = new AsyncGeneratorFunction("records", yieldCallExpression) as (
        records: Record<string, unknown>[],
      ) => AsyncGenerator<Record<string, unknown>>;
      break;
    }
    case "map-records": {
      void mapRecords(event.data.records);
      break;
    }
    default:
      impossible(event.data);
  }
};

async function mapRecords(records: Record<string, unknown>[]) {
  if (!fn) {
    throw new Error("Function not set");
  }
  const it = fn(records);
  for await (const record of it) {
    postMessage(
      mapRecordsWorkerMessage({ type: "return-records", records: [record] }),
    );
  }
}
