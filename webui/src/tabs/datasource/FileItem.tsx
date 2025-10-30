import { CheckIcon } from "@heroicons/react/20/solid";
import { Button } from "../../components/Button";
import type {
  DataSourceFile,
  DataSourceFileFormat,
} from "../../contexts/DataSourceContext";
import { useDataSources } from "../../contexts/DataSourceContext";

export function FileItem({ file }: { file: DataSourceFile }) {
  const { confirmFile, setFileFormat } = useDataSources();

  return (
    <div className="flex flex-row items-center gap-2 p-2 bg-stone-800 rounded-md">
      <div className="flex-1">{file.file.name}</div>
      <select
        className="bg-stone-900 p-1"
        value={file.format}
        onChange={(e) =>
          setFileFormat(file.id, e.target.value as DataSourceFileFormat)
        }
      >
        <option value="json">JSON</option>
        <option value="jsonl">JSONL</option>
        <option value="ndjson">NDJSON</option>
        <option value="csv">CSV</option>
      </select>
      <Button
        onClick={() => confirmFile(file.id)}
        disabled={file.status === "confirmed"}
        icon={<CheckIcon />}
      >
        {file.status === "confirmed" ? "confirmed" : "confirm"}
      </Button>
    </div>
  );
}
