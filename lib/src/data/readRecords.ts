import { impossible } from "../impossible";
import { type CSVFormat, getCSVParseTransform } from "./getCSVParseTransform";
import {
  getJSONParseTransform,
  type JSONFormat,
} from "./getJSONParseTransform";

export type SourceFormat = JSONFormat | CSVFormat | TextFormat;
export type TextFormat = { type: "text" };

export type DataSource<TFormat extends SourceFormat = SourceFormat> = {
  format: TFormat;
  stream: ReadableStream<Uint8Array<ArrayBufferLike>>;
};

export function readRecords(
  source: DataSource<SourceFormat>,
): ReadableStream<unknown> {
  return source.stream.pipeThrough(getParseTransform(source.format));
}

function getParseTransform(format: SourceFormat) {
  switch (format.type) {
    case "json":
      return getJSONParseTransform(format);
    case "csv":
      return getCSVParseTransform(format);
    case "text":
      throw new Error("not implemented");
    default:
      impossible(format);
  }
}
