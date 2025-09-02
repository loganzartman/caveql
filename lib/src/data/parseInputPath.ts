import { createReadStream } from "node:fs";
import { Readable } from "node:stream";
import { formatFromExtension, formatFromQuery } from "./format";
import type { DataSource, SourceFormat } from "./readRecords";

export function parseInputPath(uri: string): DataSource {
  const parts = uri.split("?");
  const path = parts[0];
  const query = parts[1]
    ? new URLSearchParams(parts[1])
    : new URLSearchParams();

  let format: SourceFormat;
  if (query.has("type")) {
    format = formatFromQuery(query);
  } else {
    format = formatFromExtension(path);
  }

  const stream = Readable.toWeb(
    createReadStream(path),
  ) as ReadableStream<Uint8Array>;

  return { format, stream };
}
