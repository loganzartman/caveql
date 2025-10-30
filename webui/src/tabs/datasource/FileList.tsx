import { useDataSources } from "../../contexts/DataSourceContext";
import { FileItem } from "./FileItem";

export function FileList() {
  const { files } = useDataSources();

  return (
    <div className="flex flex-col gap-2">
      {files.map((file) => (
        <FileItem key={file.id} file={file} />
      ))}
    </div>
  );
}
