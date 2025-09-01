import StreamChain from "stream-chain";
import StreamCSV from "stream-csv-as-json";
import StreamJSON from "stream-json";
import StreamArray from "stream-json/streamers/StreamArray.js";
import StreamValues from "stream-json/streamers/StreamValues.js";
import { impossible } from "../impossible";

const { chain } = StreamChain;
const { parser: jsonParser } = StreamJSON;
const { parser: csvParser } = StreamCSV;
const { streamValues } = StreamValues;
const { streamArray } = StreamArray;

export type SourceFormat = JSONFormat | CSVFormat | TextFormat;
export type JSONFormat = { type: "json"; streaming: boolean };
export type CSVFormat = { type: "csv" };
export type TextFormat = { type: "text" };

export type DataSource<TFormat extends SourceFormat = SourceFormat> = {
  format: TFormat;
  read: () => ReadableStream<Uint8Array<ArrayBufferLike>>;
};

export function readRecords(
  source: DataSource<SourceFormat>,
): AsyncIterable<unknown> {
  const pipeline = chain([
    source.read(),
    ...getParsePipeline(source.format),
    (d: { value: unknown }) => d.value,
  ]);

  return pipeline;
}

function getParsePipeline(format: SourceFormat) {
  switch (format.type) {
    case "json": {
      if (format.streaming) {
        // expects multiple top-level objects concatenated
        return [jsonParser({ jsonStreaming: true }), streamValues()];
      }
      // expects a single top-level array containing multiple objects
      return [jsonParser({ jsonStreaming: false }), streamArray()];
    }
    case "csv":
      return [csvParser(), streamValues()];
    case "text":
      return [csvParser(), streamValues()];
    default:
      impossible(format);
  }
}
