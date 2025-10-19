import CaveqlSvg from "jsx:./caveql.svg";
import {
  ArrowRightIcon,
  ChartBarIcon,
  CodeBracketIcon,
  LinkIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
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
import toast, { Toaster } from "react-hot-toast";
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
import { Editor } from "./Editor";
import { debounce } from "./lib/debounce";
import { packString, unpackString } from "./lib/pack";
import { useSortQuery } from "./lib/useSortQuery";
import { VirtualArray } from "./lib/VirtualArray";
import type { monaco } from "./monaco";
import { GenerateTab } from "./tabs/generate/GenerateTab";

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

      let didClearLoading = false;
      const flush = () => {
        if (buffer.length === 0) {
          return;
        }
        const b = buffer;
        buffer = [];
        setResults((r) => r.concat(b));

        if (!didClearLoading) {
          setResultsLoading(false);
          didClearLoading = true;
        }
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
          (async () => {
            try {
              const packed = await packString(source, "base64-deflate");
              history.replaceState(undefined, "", `#${packed}`);
            } catch (error) {
              console.error("Failed to pack hash", error);
            }
          })();
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
    (async () => {
      try {
        const packed = decodeURIComponent(window.location.hash.substring(1));
        const src = await unpackString(packed);
        handleSourceChange(src);
        editorRef.setValue(src);
      } catch (error) {
        console.error("Failed to unpack hash", error);
      }
    })();
  }, [editorRef, handleSourceChange]);

  const handleAcceptGeneratedQuery = useCallback(
    (query: string) => {
      editorRef?.setValue(query);
      handleSourceChange(query);
    },
    [editorRef, handleSourceChange],
  );

  return (
    <div
      ref={scrollRef}
      className="flex flex-col w-full h-full gap-4 p-4 overflow-auto"
    >
      <div className="shrink-0 flex flex-row justify-between">
        <CaveqlSvg />
        <div className="flex flex-row gap-4">
          <Button
            onClick={() => {
              (async () => {
                try {
                  await navigator.clipboard.writeText(
                    `${window.location.origin}${window.location.pathname}${window.location.search}#${await packString(source, "base2048-deflate")}`,
                  );
                  toast.success("Copied short link to clipboard!", {
                    style: {
                      color: "var(--color-stone-100)",
                      background: "var(--color-stone-700)",
                    },
                  });
                } catch (error) {
                  console.error("Failed to copy share link", error);
                }
              })();
            }}
            icon={<LinkIcon />}
          >
            share
          </Button>
          <Highlight enabled={!fileInput && !results?.length}>
            <UploadButton label="load data" onChange={handleUpload} />
          </Highlight>
        </div>
      </div>
      <div className="shrink-0 flex flex-col max-h-[35%]">
        <Editor editorRef={setEditorRef} onChange={handleSourceChange} />
        <LoadingStrip isLoading={resultsLoading} />
      </div>
      <TabGroup className="flex-1 flex flex-col">
        <div className="shrink-0 flex flex-row gap-4 items-stretch justify-between">
          <TabList>
            <Tab icon={<TableCellsIcon />}>table</Tab>
            <Tab icon={<ChartBarIcon />}>chart</Tab>
            <Tab icon={<MagnifyingGlassIcon />}>inspect</Tab>
            <Tab icon={<SparklesIcon />}>generate</Tab>
          </TabList>
          <div className="flex flex-row gap-2">
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
            <div className="flex flex-col h-full p-2">
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
            <TabGroup>
              <TabList>
                <Tab icon={<CodeBracketIcon />}>parse tree</Tab>
                <Tab icon={<CodeBracketIcon />}>generated</Tab>
                <Tab icon={<CodeBracketIcon />}>formatted</Tab>
              </TabList>
              <TabPanels>
                <TabPanel>
                  <pre className="text-wrap break-all overflow-auto p-2">
                    {astString ?? error}
                  </pre>
                </TabPanel>
                <TabPanel>
                  <pre className="text-wrap break-all overflow-auto p-2">
                    {compiledString ?? error}
                  </pre>
                </TabPanel>
                <TabPanel>
                  <pre className="text-wrap break-all overflow-auto p-2">
                    {ast ? printAST(ast) : error}
                  </pre>
                </TabPanel>
              </TabPanels>
            </TabGroup>
          </TabPanel>
          <TabPanel>
            <GenerateTab onAcceptQuery={handleAcceptGeneratedQuery} />
          </TabPanel>
        </TabPanels>
      </TabGroup>
      <Toaster />
    </div>
  );
}
