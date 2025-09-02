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
  type Off,
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

  const [source, setSource] = useState("");

  const handleSourceChange = useMemo(
    () =>
      debounce(
        (source: string) => {
          history.replaceState(undefined, "", `#${btoa(source)}`);
          setSource(source);
        },
        { intervalMs: 500, leading: false },
      ),
    [],
  );

  const updateSource = useCallback(
    (source: string) => {
      if (!editorRef) return;
      editorRef.setValue(source);
      handleSourceChange(source);
    },
    [editorRef, handleSourceChange],
  );

  const [fileInput, setFileInput] = useState<File[] | null>(null);
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
    setFileInput(Array.from(files));
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
    let cancelled = false;
    let flushTimer: number | undefined;

    (async () => {
      try {
        const tree = parseQuery(source).ast;
        setTree(tree);
        setTreeString(formatTree(tree));

        const context = createExecutionContext();
        const queryWorker = createQueryWorker(tree);
        setCode(formatJS(queryWorker.source));

        // TODO: multi-file input
        const file = fileInput?.[0];
        if (!file) {
          return;
        }

        handle = queryWorker.query(
          {
            type: "stream",
            stream: file.stream(),
            // TODO: customize parser settings
            format: formatFromExtension(file.name),
          },
          context,
        );

        cleanupOnContext = handle.onContext(
          debounce(
            ({ context }) => {
              setExecutionContext(context);
            },
            { intervalMs: 100 },
          ),
        );

        setResults([]);
        setResultsLoading(true);

        let buffer: Record<string, unknown>[] = [];
        const flush = () => {
          if (!buffer.length) {
            return;
          }
          setResults((prev) => (prev ? [...prev, ...buffer] : [...buffer]));
          buffer = [];
        };
        flushTimer = window.setInterval(flush, 100);

        for await (const record of handle.records) {
          if (cancelled) break;
          buffer.push(record);
          if (buffer.length >= 250) flush();
        }
        flush();
        setResultsLoading(false);
      } catch (e) {
        console.error(e);
        setError(`Error: ${e instanceof Error ? e.message : String(e)}`);
        setResults(null);
        setResultsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      if (flushTimer) window.clearInterval(flushTimer);
      handle?.cancel();
      cleanupOnContext?.();
    };
  }, [fileInput, source]);

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
