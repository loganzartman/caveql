import { AsyncQueue } from "../../../AsyncQueue";
import type { MapRecordsParams } from "./mapRecords";
import {
  type MapRecordsWorkerMessage,
  mapRecordsHostMessage,
} from "./messages";

export async function mapRecordsWeb({
  records,
  functionExpression,
}: MapRecordsParams): Promise<AsyncGenerator<Record<string, unknown>>> {
  const worker = new Worker(new URL("./workerMapWeb.ts", import.meta.url), {
    type: "module",
  });

  const resultQueue = new AsyncQueue<Record<string, unknown>>();
  worker.onmessage = (event: MessageEvent<MapRecordsWorkerMessage>) => {
    resultQueue.pushAll(event.data.records);
  };

  worker.postMessage(
    mapRecordsHostMessage({ type: "set-fn", functionExpression }),
  );

  return (async function* () {
    for await (const record of records) {
      worker.postMessage(
        mapRecordsHostMessage({
          type: "map-records",
          records: [record],
        }),
      );
      await resultQueue.wait();
      while (true) {
        const record = resultQueue.shift();
        if (record) {
          yield record;
        } else {
          break;
        }
      }
    }
    worker.terminate();
  })();
}
