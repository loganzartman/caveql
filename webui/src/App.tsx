import CaveqlSvg from "jsx:./caveql.svg";
import {
  ArrowRightIcon,
  ChartBarIcon,
  CodeBracketIcon,
  TableCellsIcon,
} from "@heroicons/react/20/solid";
import { PlayIcon } from "@heroicons/react/24/outline";
import type { QueryAST } from "caveql";
import {
  type AsyncQueryHandle,
  createExecutionContext,
  createQueryWorker,
  type ExecutionContext,
  formatFromExtension,
  formatJS,
  formatTree,
  iter,
  parseQuery,
  printAST,
} from "caveql";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "./components/Button";
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
import { VirtualArray } from "./VirtualArray";

const DEFAULT_RESULTS_LIMIT = 100_000;

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
  const [results, setResults] = useState<VirtualArray<Record<string, unknown>>>(
    VirtualArray.create(),
  );
  const resultsRef = useRef(results);
  resultsRef.current = results;
  const [resultsLimit, setResultsLimit] = useState<number>(
    DEFAULT_RESULTS_LIMIT,
  );
  const [resultsLimited, setResultsLimited] = useState(false);

  const [queryIterator, setQueryIterator] = useState<AsyncIterator<
    Record<string, unknown>
  > | null>(null);

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
    setResults((r) => r.clear());
    setError(null);
    setResultsLoading(true);
    setAST(null);
    setCompiled(null);
    setExecutionContext(context);
    setResultsLimit(DEFAULT_RESULTS_LIMIT);
    setResultsLimited(false);

    let handle: AsyncQueryHandle | undefined;

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
      setQueryIterator(iter(handle.records));
    } catch (error) {
      console.error(error);
      setError(error instanceof Error ? error.message : String(error));
    }

    return () => {
      handle?.cancel();
    };
  }, [source, fileInput]);

  useEffect(() => {
    if (!queryIterator) {
      return;
    }

    let stop = false;
    let timeout: NodeJS.Timeout | undefined;
    let intv: NodeJS.Timeout | undefined;

    (async () => {
      let buffer: Array<Record<string, unknown>> = [];

      const flush = () => {
        if (buffer.length === 0) {
          return;
        }
        const b = buffer;
        buffer = [];
        setResults((r) => r.concat(b));
      };

      // initial fast flush
      timeout = setTimeout(() => {
        flush();
      }, 100);

      // regular intervaled flush
      intv = setInterval(() => {
        flush();
      }, 500);

      while (!stop) {
        const result = await queryIterator.next();
        if (result.done) {
          break;
        }

        buffer.push(result.value);

        if (resultsRef.current.length + buffer.length >= resultsLimit) {
          setResultsLimited(true);
          break;
        }
      }
      flush();

      setResultsLoading(false);
    })().catch((error) => {
      console.error(error);
      setError(error instanceof Error ? error.message : String(error));
    });

    return () => {
      stop = true;
      if (timeout) {
        clearTimeout(timeout);
      }
      if (intv) {
        clearInterval(intv);
      }
    };
  }, [queryIterator, resultsLimit]);

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

  const handleUpload = useCallback(({ files }: { files: FileList }) => {
    const filesArray = Array.from(files);
    setFileInput(filesArray);
  }, []);

  const handleSourceChange = useCallback(
    (source: string) => {
      updateHash(source);
      setSource(source);
    },
    [updateHash],
  );

  const updateSource = useCallback(
    (source: string) => {
      editorRef?.setValue(source);
      handleSourceChange(source);
    },
    [editorRef, handleSourceChange],
  );

  const [sort, setSort] = useSortQuery(source, updateSource);

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
      <div className="shrink-0 flex flex-row justify-between">
        <CaveqlSvg />
        <div className="flex flex-row gap-4">
          <Highlight enabled={!fileInput && !results?.length}>
            <UploadButton label="add data" onChange={handleUpload} />
          </Highlight>
        </div>
      </div>
      <div className="shrink-0 flex flex-col">
        <Editor editorRef={setEditorRef} onChange={handleSourceChange} />
        <LoadingStrip isLoading={resultsLoading} />
      </div>
      <TabGroup className="flex-1 flex flex-col">
        <div className="shrink-0 flex flex-row gap-4 items-stretch justify-between">
          <TabList>
            <Tab icon={<TableCellsIcon />}>table</Tab>
            <Tab icon={<ChartBarIcon />}>chart</Tab>
            <Tab icon={<CodeBracketIcon />}>parse tree</Tab>
            <Tab icon={<CodeBracketIcon />}>generated</Tab>
            <Tab icon={<CodeBracketIcon />}>formatted</Tab>
          </TabList>
          {resultsLimited && (
            <Button
              variant="quiet"
              className="shrink-0"
              onClick={() => {
                setResultsLimit(
                  (resultsLimit) => resultsLimit + DEFAULT_RESULTS_LIMIT,
                );
                setResultsLimited(false);
              }}
              icon={<PlayIcon />}
            >
              load more
            </Button>
          )}
          {results && (
            <div className="shrink-0 flex flex-row gap-1 items-center">
              <span className="font-black tabular-nums">
                {countFormatter.format(executionContext.recordsRead)}
              </span>{" "}
              in
              <ArrowRightIcon className="w-[1em]" />
              <span className="font-black tabular-nums">
                {countFormatter.format(results.length)}
              </span>{" "}
              out
            </div>
          )}
        </div>
        <TabPanels>
          <TabPanel>
            {results && (
              <ResultsTable
                results={results.items}
                fieldSet={results.fieldSet}
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
                {results && <ResultsChart type={chartType} results={results} />}
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
  );
}
