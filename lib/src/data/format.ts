import type { SourceFormat } from "./readRecords";

export function formatFromPath(uri: string): SourceFormat {
  const parts = uri.split("?");
  const path = parts[0];
  const query = parts[1]
    ? new URLSearchParams(parts[1])
    : new URLSearchParams();

  if (query.has("type")) {
    return formatFromQuery(query);
  }
  return formatFromExtension(path);
}

export function formatFromQuery(query: URLSearchParams): SourceFormat {
  const typeParam = query.get("type");
  if (typeParam !== "json" && typeParam !== "csv" && typeParam !== "text") {
    throw new Error(`Invalid format type: ${typeParam}`);
  }
  const type = typeParam;

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
