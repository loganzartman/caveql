import { createContext, useContext, useState } from "react";
import { inferFileFormat } from "../lib/inferFileFormat";

export type DataSourceFileFormat = "json" | "jsonl" | "ndjson" | "csv";

import { v4 as uuidv4 } from "uuid";

export interface DataSourceFile {
  id: string;
  file: File;
  status: "pending" | "confirmed";
  format: DataSourceFileFormat;
}

interface DataSourceContextValue {
  files: DataSourceFile[];
  addFiles: (files: File[]) => void;
  confirmFile: (file: File) => void;
  clearFiles: () => void;
  setFileFormat: (file: File, format: DataSourceFileFormat) => void;
}

const DataSourceContext = createContext<DataSourceContextValue | undefined>(
  undefined
);

export function DataSourceProvider({ children }: { children: React.ReactNode }) {
  const [files, setFiles] = useState<DataSourceFile[]>([]);

  const addFiles = (newFiles: File[]) => {
    const newDataSourceFiles = newFiles.map((file) => {
      const format = inferFileFormat(file.name) || ("json" as const);
      return {
        id: uuidv4(),
        file,
        status: "pending" as const,
        format,
      };
    });
    setFiles((prevFiles) => [...prevFiles, ...newDataSourceFiles]);
  };

  const confirmFile = (idToConfirm: string) => {
    setFiles((prevFiles) =>
      prevFiles.map((file) =>
        file.id === idToConfirm
          ? { ...file, status: "confirmed" }
          : file
      )
    );
  };

  const clearFiles = () => {
    setFiles([]);
  };

  const setFileFormat = (idToUpdate: string, format: DataSourceFileFormat) => {
    setFiles((prevFiles) =>
      prevFiles.map((file) =>
        file.id === idToUpdate ? { ...file, format } : file
      )
    );
  };

  return (
    <DataSourceContext.Provider
      value={{ files, addFiles, confirmFile, clearFiles, setFileFormat }}
    >
      {children}
    </DataSourceContext.Provider>
  );
}

export function useDataSources() {
  const context = useContext(DataSourceContext);
  if (!context) {
    throw new Error("useDataSources must be used within a DataSourceProvider");
  }
  return context;
}
