import { useDataSources } from "../../contexts/DataSourceContext";
import { FileList } from "./FileList";

import { Button } from "../../components/Button";
import { TrashIcon } from "@heroicons/react/20/solid";

export function DataSourceTab() {
  const { files, addFiles, clearFiles } = useDataSources();

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const droppedFiles = Array.from(event.dataTransfer.files);
    addFiles(droppedFiles);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  return (
    <div
      className="p-4 flex flex-col gap-2 items-start h-full"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <div className="w-full flex flex-row items-center justify-between gap-3 mt-2 mb-6">
        <div>
          <div className="text-2xl font-semibold">upload data sources</div>
          <div className="text-sm text-stone-400">
            drag and drop JSON, JSONL, NDJSON, and CSV files
          </div>
        </div>
        <Button onClick={clearFiles} icon={<TrashIcon />}>
          clear
        </Button>
      </div>
      <div className="w-full h-full border-2 border-dashed border-stone-500 rounded-md p-4">
        <FileList />
      </div>
    </div>
  );
}
