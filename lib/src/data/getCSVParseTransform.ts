import { inferSchema, initParser, type Parser } from "udsv";

export type CSVFormat = { type: "csv" };

export function getCSVParseTransform(_format: CSVFormat) {
  let parser: Parser | null = null;
  const stream = new TransformStream();
  const readable = stream.readable
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(
      new TransformStream({
        transform(chunk, controller) {
          parser ??= initParser(inferSchema(chunk));
          parser.chunk(
            chunk,
            parser.typedObjs,
            (row: Record<string, unknown>) => {
              controller.enqueue(row);
            },
          );
        },
      }),
    );

  return { writable: stream.writable, readable };
}
