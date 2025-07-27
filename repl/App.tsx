import CaveqlSvg from "jsx:./caveql.svg";
import {
  ArrowRightIcon,
  ChartBarIcon,
  CodeBracketIcon,
  TableCellsIcon,
} from "@heroicons/react/20/solid";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  type AsyncQueryHandle,
  createExecutionContext,
  createQueryWorker,
  type ExecutionContext,
  formatJS,
  formatTree,
  type Off,
  parseQuery,
} from "../src";
import type { QueryAST } from "../src/parser";
import { printAST } from "../src/printer/printAST";
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
import { Editor } from "./Editor";
import type { monaco } from "./monaco";
import { useSortQuery } from "./useSortQuery";

export function App() {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [editorRef, setEditorRef] =
    useState<monaco.editor.IStandaloneCodeEditor | null>(null);

  const [source, setSource] = useState("");

  const handleSourceChange = useCallback((source: string) => {
    history.replaceState(undefined, "", `#${btoa(source)}`);
    setSource(source);
  }, []);

  const updateSource = useCallback(
    (source: string) => {
      if (!editorRef) return;
      editorRef.setValue(source);
      handleSourceChange(source);
    },
    [editorRef, handleSourceChange],
  );

  const [inputRecords, setInputRecords] = useState<Record<string, unknown>[]>(
    [],
  );
  const [chartType, setChartType] = useState<"bar" | "line">("bar");
  const [sort, setSort] = useSortQuery(source, updateSource);

  useEffect(() => {
    if (!editorRef) return;
    try {
      const src = atob(window.location.hash.substring(1));
      editorRef.setValue(src);
      setSource(src);
    } catch {
      console.log("Failed to parse document hash");
    }
  }, [editorRef]);

  const countFormatter = useMemo(() => {
    return new Intl.NumberFormat(undefined, {});
  }, []);

  const handleUpload = useCallback(({ files }: { files: FileList }) => {
    (async () => {
      const file = files[0];
      if (!file) {
        throw new Error("Expected exactly one file upload");
      }
      if (file.type !== "application/json") {
        throw new Error("Expected JSON");
      }
      const text = await file.text();
      const json = JSON.parse(text);
      if (!Array.isArray(json)) {
        throw new Error("Expected JSON array");
      }
      setInputRecords(json);
    })().catch((e) => console.error(e));
  }, []);

  const [resultsLoading, setResultsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tree, setTree] = useState<QueryAST | null>(null);
  const [treeString, setTreeString] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, unknown>[] | null>(
    null,
  );
  const [executionContext, setExecutionContext] = useState<ExecutionContext>(
    createExecutionContext(),
  );

  useEffect(() => {
    let handle: AsyncQueryHandle | undefined;
    let cleanupOnContext: Off | undefined;

    try {
      const tree = parseQuery(source).ast;
      setTree(tree);
      setTreeString(formatTree(tree));

      const context = createExecutionContext();

      const queryWorker = createQueryWorker(tree);
      handle = queryWorker.query(
        {
          type: "iterable",
          value: inputRecords,
        },
        context,
      );
      cleanupOnContext = handle.onContext(({ context }) => {
        setExecutionContext(context);
      });

      setCode(formatJS(queryWorker.source));
    } catch (e) {
      setError(`Error: ${e instanceof Error ? e.message : String(e)}`);
      setResults(null);
    }

    (async () => {
      try {
        if (!handle) {
          return;
        }
        setResultsLoading(true);
        setResults(await Array.fromAsync(handle.records));
        setResultsLoading(false);
      } catch (e) {
        setError(`Error: ${e instanceof Error ? e.message : String(e)}`);
        setResults(null);
        setResultsLoading(false);
      }
    })();

    return () => {
      handle?.cancel();
      cleanupOnContext?.();
    };
  }, [inputRecords, source]);

  return (
    <div
      ref={scrollRef}
      className="flex flex-col w-full h-full gap-4 p-4 overflow-auto"
    >
      <div className="flex flex-row justify-between">
        <CaveqlSvg />
        <div className="flex flex-row gap-4">
          <Highlight enabled={inputRecords.length === 0 && !results?.length}>
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
                {treeString ?? error}
              </pre>
            </TabPanel>
            <TabPanel>
              <pre className="text-wrap break-all overflow-auto">
                {code ?? error}
              </pre>
            </TabPanel>
            <TabPanel>
              <pre className="text-wrap break-all overflow-auto">
                {tree ? printAST(tree) : error}
              </pre>
            </TabPanel>
          </TabPanels>
        </TabGroup>
      </div>
    </div>
  );
}
