import type { DataSourceFileFormat } from "../contexts/DataSourceContext";

export function inferFileFormat(
  fileName: string
): DataSourceFileFormat | null {
  const extension = fileName.split(".").pop()?.toLowerCase();
  switch (extension) {
    case "json":
      return "json";
    case "jsonl":
      return "jsonl";
    case "ndjson":
      return "ndjson";
    case "csv":
      return "csv";
    default:
      return null;
  }
}
