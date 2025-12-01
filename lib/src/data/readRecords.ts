import type { ExecutionContext } from "../compiler";
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
  context?: ExecutionContext,
): ReadableStream<unknown> {
  let stream = source.stream;

  if (context) {
    stream = stream.pipeThrough(createByteCountingTransform(context));
  }

  return stream.pipeThrough(getParseTransform(source.format));
}

function createByteCountingTransform(
  context: ExecutionContext,
): TransformStream<Uint8Array, Uint8Array> {
  return new TransformStream({
    transform(chunk, controller) {
      context.bytesRead += chunk.byteLength;
      controller.enqueue(chunk);
    },
  });
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
