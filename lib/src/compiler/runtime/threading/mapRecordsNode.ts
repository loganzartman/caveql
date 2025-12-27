import { Worker as NodeWorker } from "node:worker_threads";
import { AsyncQueue } from "../../../AsyncQueue";
import type { MapRecordsParams } from "./mapRecords";
import {
  type MapRecordsWorkerMessage,
  mapRecordsHostMessage,
} from "./messages";

export async function mapRecordsNode({
  records,
  expression,
}: MapRecordsParams): Promise<AsyncGenerator<Record<string, unknown>>> {
  const worker = new NodeWorker(new URL("./workerNode.ts", import.meta.url));

  const resultQueue = new AsyncQueue<Record<string, unknown>>();
  worker.on("message", (event: MapRecordsWorkerMessage) => {
    resultQueue.pushAll(event.records);
  });

  worker.postMessage(
    mapRecordsHostMessage({ type: "set-expression", expression }),
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
