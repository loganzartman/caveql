import streamChain from "stream-chain";
import streamCSV from "stream-csv-as-json";
import streamJSON from "stream-json";
import StreamValues from "stream-json/streamers/StreamValues.js";
import { Readable } from "stream";
import { impossible } from "../impossible";

const { chain, dataSource } = streamChain;
const { parser: jsonParser } = streamJSON;
const { parser: csvParser } = streamCSV;

export type SourceFormat = JSONFormat | CSVFormat | TextFormat;
export type JSONFormat = { type: "json" };
export type CSVFormat = { type: "csv" };
export type TextFormat = { type: "text" };

export type DataSource<TFormat extends SourceFormat = SourceFormat> =
  | StringSource<TFormat>
  | FileSource<TFormat>;

export type StringSource<TFormat extends SourceFormat> = {
  type: "string";
  format: TFormat;
  data: Iterable<string>;
};

export type FileSource<TFormat extends SourceFormat> = {
  type: "file";
  format: TFormat;
  file: File;
};

export async function readDataSource(
  source: DataSource<SourceFormat>,
): Promise<AsyncIterable<unknown>> {
  switch (source.type) {
    case "string":
      return readStringSource(source);
    case "file":
      return readFileSource(source);
    default:
      impossible(source);
  }
}

export function readStringSource(
  source: StringSource<SourceFormat>,
): AsyncIterable<unknown> {
  // Convert the string data to a Node.js Readable stream
  const { Readable } = require('stream');
  const dataString = Array.from(source.data).join('');
  const stream = Readable.from([dataString]);
  
  const parsers = parseFormat(source.format);
  const pipeline = chain([dataSource(stream), ...parsers]);
  
  return {
    [Symbol.asyncIterator]() {
      return pipeline[Symbol.asyncIterator]();
    },
  };
}

export async function readFileSource(
  source: FileSource<SourceFormat>,
): Promise<AsyncIterable<unknown>> {
  // Convert Web ReadableStream to Node.js stream for compatibility with stream-chain
  const webStream = source.file.stream();
  // biome-ignore lint/suspicious/noExplicitAny: Type conflict between web and node streams
  const nodeStream = Readable.fromWeb(webStream as any);
  
  const parsers = parseFormat(source.format);
  const pipeline = chain([dataSource(nodeStream), ...parsers]);
  
  return {
    [Symbol.asyncIterator]() {
      return pipeline[Symbol.asyncIterator]();
    },
  };
}

function parseFormat(format: SourceFormat) {
  switch (format.type) {
    case "json":
      // For JSON, we need to parse the stream and extract values
      // This handles both JSON arrays and NDJSON
      return [jsonParser(), StreamValues.withParser()];
    case "csv":
      return [csvParser()];
    case "text":
      return [csvParser()];
    default:
      impossible(format);
  }
}
