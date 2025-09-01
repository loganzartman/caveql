import { createReadStream } from "node:fs";
import { Readable } from "node:stream";
import { z } from "zod";
import type { DataSource, SourceFormat } from "./readRecords";

const formatTypeSchema = z.union([
  z.literal("json"),
  z.literal("csv"),
  z.literal("text"),
]);

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

  const read = () => {
    return Readable.toWeb(createReadStream(path)) as ReadableStream<Uint8Array>;
  };

  return { format, read } as const;
}

function formatFromQuery(query: URLSearchParams): SourceFormat {
  const type = formatTypeSchema.parse(query.get("type"));

  if (type === "json") {
    const streaming =
      query.get("streaming") === "" || query.get("streaming") === "true";
    return { type, streaming };
  }

  return { type };
}

function formatFromExtension(path: string): SourceFormat {
  const extension = path.split(".").at(-1);
  switch (extension) {
    case "json":
      return { type: "json", streaming: false };
    case "jsonl":
    case "ndjson":
      return { type: "json", streaming: true };
    case "csv":
      return { type: "csv" };
    default:
      return { type: "text" };
  }
}
