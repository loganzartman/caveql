import { Tokenizer, TokenParser } from "@streamparser/json-whatwg";

export type JSONFormat = { type: "json"; streaming: boolean };

export function getJSONParseTransform(format: JSONFormat) {
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
