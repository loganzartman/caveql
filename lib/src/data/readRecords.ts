import { Tokenizer, TokenParser } from "@streamparser/json-whatwg";
import { impossible } from "../impossible";

export type SourceFormat = JSONFormat | CSVFormat | TextFormat;
export type JSONFormat = { type: "json"; streaming: boolean };
export type CSVFormat = { type: "csv" };
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
      throw new Error("not implemented");
    case "text":
      throw new Error("not implemented");
    default:
      impossible(format);
  }
}

function getJSONParseTransform(format: JSONFormat) {
  const separator = "\n";

  if (format.streaming) {
    const stream = new TransformStream();
    const readable = stream.readable
      .pipeThrough(new Tokenizer({ separator }))
      .pipeThrough(new TokenParser({ separator, paths: ["$"] }))
      .pipeThrough(
        new TransformStream({
          transform(chunk, controller) {
            if (chunk.value) {
              controller.enqueue(chunk.value);
            }
          },
        }),
      );
    return { writable: stream.writable, readable };
  }

  // expects a single top-level array containing multiple objects
  const stream = new TransformStream();
  const readable = stream.readable
    .pipeThrough(new Tokenizer({ separator }))
    .pipeThrough(new TokenParser({ separator, paths: ["$.*"] }))
    .pipeThrough(
      new TransformStream({
        transform(chunk, controller) {
          if (chunk.value) {
            controller.enqueue(chunk.value);
          }
        },
      }),
    );
  return { writable: stream.writable, readable };
}
