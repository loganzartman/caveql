import streamChain from "stream-chain";
import streamCSV from "stream-csv-as-json";
import streamJSON from "stream-json";
import { impossible } from "../impossible";

const { chain, dataSource } = streamChain;
const { parser: jsonParser } = streamJSON;
const { parser: csvParser } = streamCSV;

export type SourceFormat = JSONFormat | CSVFormat;
export type JSONFormat = { type: "json" };
export type CSVFormat = { type: "csv" };

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
): Promise<AsyncIterator<unknown>> {
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
): AsyncIterator<unknown> {
  const pipeline = chain([dataSource(source.data), parseFormat(source.format)]);
  return pipeline.iterator();
}

export async function readFileSource(
  source: FileSource<SourceFormat>,
): Promise<AsyncIterator<unknown>> {
  const pipeline = chain([
    dataSource(source.file.stream()),
    parseFormat(source.format),
  ]);
  return pipeline.iterator();
}

function parseFormat(format: SourceFormat) {
  switch (format.type) {
    case "json":
      return jsonParser();
    case "csv":
      return csvParser();
    default:
      impossible(format);
  }
}
