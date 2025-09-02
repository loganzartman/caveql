import * as z from "zod";
import type { SourceFormat } from "./readRecords";

export const formatTypeSchema = z.union([
  z.literal("json"),
  z.literal("csv"),
  z.literal("text"),
]);

export function formatFromQuery(query: URLSearchParams): SourceFormat {
  const type = formatTypeSchema.parse(query.get("type"));

  if (type === "json") {
    const streaming =
      query.get("stream") === "" || query.get("stream") === "true";
    return { type, streaming };
  }

  return { type };
}

export function formatFromExtension(path: string): SourceFormat {
  const extension = path.split(".").at(-1)?.toLowerCase();
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
