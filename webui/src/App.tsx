import CaveqlSvg from "jsx:./caveql.svg";
import {
  ArrowRightIcon,
  ChartBarIcon,
  CodeBracketIcon,
  TableCellsIcon,
} from "@heroicons/react/20/solid";
import type { QueryAST } from "caveql";
import {
  type AsyncQueryHandle,
  createExecutionContext,
  createQueryWorker,
  type ExecutionContext,
  formatFromExtension,
  formatJS,
  formatTree,
  parseQuery,
  printAST,
} from "caveql";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChartTypeSelector } from "./components/ChartTypeSelector";
import { ResultsChart } from "./components/chart/ResultsChart";
import { Highlight } from "./components/Highlight";
import { LoadingStrip } from "./components/LoadingStrip";
import { ResultsTable } from "./components/ResultsTable";
import { Tab } from "./components/Tab";
import { TabGroup } from "./components/TabGroup";
import { TabList } from "./components/TabList";
import { TabPanel } from "./components/TabPanel";
import { TabPanels } from "./components/TabPanels";
import { UploadButton } from "./components/UploadButton";
import { debounce } from "./debounce";
import { Editor } from "./Editor";
import type { monaco } from "./monaco";
import { useSortQuery } from "./useSortQuery";

export function App() {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [editorRef, setEditorRef] =
    useState<monaco.editor.IStandaloneCodeEditor | null>(null);

  const [source, setSource] = useState<string>("");
  const [fileInput, setFileInput] = useState<File[] | null>(null);

  const [resultsLoading, setResultsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [ast, setAST] = useState<QueryAST | null>(null);
  const [compiled, setCompiled] = useState<string | null>(null);
  const [executionContext, setExecutionContext] = useState<ExecutionContext>(
    createExecutionContext(),
  );
  const [results, setResults] = useState<Record<string, unknown>[] | null>(
    null,
  );

  const [chartType, setChartType] = useState<"bar" | "line">("bar");

  const countFormatter = useMemo(() => {
    return new Intl.NumberFormat(undefined, {});
  }, []);

  const astString = useMemo(() => {
    if (!ast) return null;
    try {
      return formatTree(ast);
    } catch {
      return null;
    }
  }, [ast]);

  const compiledString = useMemo(() => {
    if (!compiled) return null;
    try {
      return formatJS(compiled);
    } catch {
      return null;
    }
  }, [compiled]);

  useEffect(() => {
    const context = createExecutionContext();
    setResults([]);
    setError(null);
    setResultsLoading(true);
    setAST(null);
    setCompiled(null);
    setExecutionContext(context);

    let handle: AsyncQueryHandle | undefined;
    let stop = false;
    let intv: NodeJS.Timeout | undefined;

    try {
      const { ast } = parseQuery(source);
      const worker = createQueryWorker(ast);

      setAST(ast);
      setCompiled(worker.source);

      // TODO: multi-file
      const file = fileInput?.[0];
      if (file) {
        handle = worker.query({
          type: "stream",
          format: formatFromExtension(file.name),
          stream: file.stream(),
        });
      } else {
        handle = worker.query({
          type: "iterable",
          value: [],
        });
      }

      handle.onContext(({ context }) => setExecutionContext(context));

      (async () => {
        let buffer: Array<Record<string, unknown>> = [];

        const flush = () => {
          const b = buffer;
          setResults((prev) => (prev ? [...prev, ...b] : [...b]));
          buffer = [];
        };

        intv = setInterval(() => {
          if (buffer.length > 0) {
            flush();
          }
        }, 250);

        for await (const record of handle.records) {
          if (stop) {
            break;
          }
          buffer.push(record);
          if (buffer.length >= 100) {
            flush();
          }
        }
        flush();
        setResultsLoading(false);
      })().catch((error) => {
        console.error(error);
        setError(error instanceof Error ? error.message : String(error));
      });
    } catch (error) {
      console.error(error);
      setError(error instanceof Error ? error.message : String(error));
    }

    return () => {
      handle?.cancel();
      stop = true;
      if (intv) {
        clearInterval(intv);
      }
    };
  }, [source, fileInput]);

  const updateHash = useMemo(
    () =>
      debounce(
        (source: string) => {
          history.replaceState(undefined, "", `#${btoa(source)}`);
        },
        { intervalMs: 500, leading: false },
      ),
    [],
  );

  const updateSource = useCallback(
    (source: string) => {
      updateHash(source);
      setSource(source);
    },
    [updateHash],
  );

  const [sort, setSort] = useSortQuery(source, updateSource);

  const handleUpload = useCallback(({ files }: { files: FileList }) => {
    const filesArray = Array.from(files);
    setFileInput(filesArray);
  }, []);

  const handleSourceChange = useCallback(
    (source: string) => {
      updateSource(source);
    },
    [updateSource],
  );

  useEffect(() => {
    if (!editorRef) return;
    try {
      const src = atob(window.location.hash.substring(1));
      editorRef.setValue(src);
      handleSourceChange(src);
    } catch {
      console.log("Failed to parse document hash");
    }
  }, [editorRef, handleSourceChange]);

  return (
    <div
      ref={scrollRef}
      className="flex flex-col w-full h-full gap-4 p-4 overflow-auto"
    >
      <div className="flex flex-row justify-between">
        <CaveqlSvg />
        <div className="flex flex-row gap-4">
          <Highlight enabled={!fileInput && !results?.length}>
            <UploadButton label="add data" onChange={handleUpload} />
          </Highlight>
        </div>
      </div>
      <div className="flex flex-col">
        <Editor editorRef={setEditorRef} onChange={handleSourceChange} />
        <LoadingStrip isLoading={resultsLoading} />
      </div>
      <div className="grow shrink">
        <TabGroup>
          <div className="flex flex-row justify-between">
            <TabList>
              <Tab icon={<TableCellsIcon />}>table</Tab>
              <Tab icon={<ChartBarIcon />}>chart</Tab>
              <Tab icon={<CodeBracketIcon />}>parse tree</Tab>
              <Tab icon={<CodeBracketIcon />}>generated</Tab>
              <Tab icon={<CodeBracketIcon />}>formatted</Tab>
            </TabList>
            {results && (
              <div className="shrink-0 flex flex-row gap-1 items-center">
                <span className="font-black">
                  {countFormatter.format(executionContext.recordsRead)}
                </span>{" "}
                records scanned
                <ArrowRightIcon className="w-[1em]" />
                <span className="font-black">
                  {countFormatter.format(results.length)}
                </span>{" "}
                results out
              </div>
            )}
          </div>
          <TabPanels>
            <TabPanel>
              {results && (
                <ResultsTable
                  results={results}
                  scrollRef={scrollRef}
                  sort={sort}
                  onSortChange={setSort}
                />
              )}
              {resultsLoading && (
                <div className="flex flex-col items-center justify-center h-full">
                  <span>Loading results...</span>
                </div>
              )}
            </TabPanel>
            <TabPanel>
              <div className="flex flex-col h-full">
                <ChartTypeSelector
                  chartType={chartType}
                  onChange={setChartType}
                />
                <div className="grow">
                  {results && (
                    <ResultsChart type={chartType} results={results} />
                  )}
                </div>
              </div>
            </TabPanel>
            <TabPanel>
              <pre className="text-wrap break-all overflow-auto">
                {astString ?? error}
              </pre>
            </TabPanel>
            <TabPanel>
              <pre className="text-wrap break-all overflow-auto">
                {compiledString ?? error}
              </pre>
            </TabPanel>
            <TabPanel>
              <pre className="text-wrap break-all overflow-auto">
                {ast ? printAST(ast) : error}
              </pre>
            </TabPanel>
          </TabPanels>
        </TabGroup>
      </div>
    </div>
  );
}
