import CaveqlSvg from "jsx:./caveql.svg";
import {
  ArrowRightIcon,
  ChartBarIcon,
  LinkIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  TableCellsIcon,
} from "@heroicons/react/20/solid";
import { PlayIcon } from "@heroicons/react/24/outline";
import type { Progress, QueryAST } from "caveql";
import {
  type AsyncQueryHandle,
  createExecutionContext,
  createQueryWorker,
  type ExecutionContext,
  formatFromExtension,
  iter,
  parseQuery,
} from "caveql";
import clsx from "clsx";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { AppContext, type ResultsChartType } from "./AppContext";
import { Button } from "./components/Button";
import { Highlight } from "./components/Highlight";
import { LoadingStrip } from "./components/LoadingStrip";
import { TabLink } from "./components/TabLink";
import { UploadButton } from "./components/UploadButton";
import { Editor } from "./Editor";
import { formatAST, formatQuerySource } from "./format";
import { debounce } from "./lib/debounce";
import { packString, unpackString } from "./lib/pack";
import { useSortQuery } from "./lib/useSortQuery";
import { VirtualArray } from "./lib/VirtualArray";
import type { monaco } from "./monaco";
import { Outlet, useSearchParams } from "./router";

export function App() {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [editorRef, setEditorRef] =
    useState<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const [source, setSource] = useState<string>("");
  const [fileInput, setFileInput] = useState<File[] | null>(null);

  const [resultsLoading, setResultsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [ast, setAST] = useState<QueryAST | null>(null);
  const [astString, setASTString] = useState<string | null>(null);
  const [compiled, setCompiled] = useState<string | null>(null);
  const [executionContext, setExecutionContext] = useState<ExecutionContext>(
    createExecutionContext(),
  );
  const [results, setResults] = useState<VirtualArray<Record<string, unknown>>>(
    VirtualArray.create(),
  );
  const resultsRef = useRef(results);
  resultsRef.current = results;
  const [resultsLimited, setResultsLimited] = useState(false);
  const [handleLoadMore, setHandleLoadMore] = useState<() => void>(() => {});
  const [progress, setProgress] = useState<Progress>("indeterminate");

  const [queryIterator, setQueryIterator] = useState<AsyncIterator<
    Record<string, unknown>
  > | null>(null);

  const [chartType, setChartType] = useState<ResultsChartType>("bar");

  const countFormatter = useMemo(() => {
    return new Intl.NumberFormat(undefined, {});
  }, []);

  useEffect(() => {
    // TODO: multi-file
    const file = fileInput?.[0];
    const context = createExecutionContext({
      bytesTotal: file?.size ?? null,
    });

    setResults((r) => r.clear());
    setError(null);
    setResultsLoading(true);
    setAST(null);
    setCompiled(null);
    setExecutionContext(context);
    setResultsLimited(false);
    setProgress("indeterminate");

    let handle: AsyncQueryHandle | undefined;

    try {
      const { ast } = parseQuery(source);
      setAST(ast);
      formatAST(ast)
        .then((formatted) => {
          setASTString(formatted);
        })
        .catch((err) => {
          console.error("Failed to format AST:", err);
          setASTString(JSON.stringify(ast, null, 2));
        });

      const worker = createQueryWorker(ast);

      formatQuerySource(worker.source)
        .then((formatted) => {
          setCompiled(formatted);
        })
        .catch((err) => {
          console.error("Failed to format compiled code:", err);
          setCompiled(worker.source);
        });

      if (file) {
        handle = worker.query(
          {
            type: "stream",
            format: formatFromExtension(file.name),
            stream: file.stream(),
            sizeBytes: file.size,
          },
          context,
        );
      } else {
        handle = worker.query({
          type: "iterable",
          value: [],
          approxCount: null,
        });
      }

      handle.onContext(({ context }) => setExecutionContext(context));
      handle.onProgress(({ progress }) => setProgress(progress));
      handle.onResultsLimited(() => setResultsLimited(true));
      const { loadMore } = handle;
      setHandleLoadMore(() => loadMore);
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
  }, [queryIterator]);

  const updateSearchParams = useMemo(
    () =>
      debounce(
        (source: string) => {
          (async () => {
            try {
              const packed = await packString(source, "base64-deflate");
              setSearchParams({ q: packed }, { replace: true });
            } catch (error) {
              console.error("Failed to update search params", error);
            }
          })();
        },
        { intervalMs: 500, leading: false },
      ),
    [setSearchParams],
  );

  const handleUpload = useCallback(({ files }: { files: FileList }) => {
    const filesArray = Array.from(files);
    setFileInput(filesArray);
  }, []);

  const handleSourceChange = useCallback(
    (source: string) => {
      updateSearchParams(source);
      setSource(source);
    },
    [updateSearchParams],
  );

  const updateSource = useCallback(
    (source: string) => {
      editorRef?.setValue(source);
      handleSourceChange(source);
    },
    [editorRef, handleSourceChange],
  );

  const [sort, setSort] = useSortQuery(source, updateSource);

  const onceRef = useRef(false);
  if (!onceRef.current && editorRef) {
    onceRef.current = true;
    (async () => {
      try {
        const packed = searchParams.get("q");
        if (!packed) return;

        const src = await unpackString(packed);
        handleSourceChange(src);
        editorRef.setValue(src);
      } catch (error) {
        console.error("Failed to load query from URL", error);
      }
    })();
  }

  const handleAcceptGeneratedQuery = useCallback(
    (query: string) => {
      const value = editorRef?.getValue() ?? "";
      const newValue = `${value}\n${query}`;
      editorRef?.setValue(newValue);
      handleSourceChange(newValue);
    },
    [editorRef, handleSourceChange],
  );

  const contextValue = useMemo(
    () => ({
      results,
      resultsLoading,
      sort,
      onSortChange: setSort,
      chartType,
      setChartType,
      ast,
      astString,
      compiled,
      error,
      onAcceptQuery: handleAcceptGeneratedQuery,
    }),
    [
      results,
      resultsLoading,
      sort,
      setSort,
      chartType,
      ast,
      astString,
      compiled,
      error,
      handleAcceptGeneratedQuery,
    ],
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
                  const packed = await packString(source, "base2048-deflate");
                  const url = new URL(window.location.href);
                  url.searchParams.set("q", "<PACKED>");
                  await navigator.clipboard.writeText(
                    url.toString().replace("<PACKED>", packed),
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
        <LoadingStrip
          isLoading={resultsLoading}
          progress={progress === "indeterminate" ? null : progress}
        />
      </div>
      <AppContext.Provider value={contextValue}>
        <div className="flex-1 flex flex-col">
          <div className="shrink-0 flex flex-row gap-4 items-stretch justify-between">
            <nav className="shrink-0 flex flex-row">
              <TabLink to="/table" icon={<TableCellsIcon />}>
                table
              </TabLink>
              <TabLink to="/chart" icon={<ChartBarIcon />}>
                chart
              </TabLink>
              <TabLink to="/inspect" icon={<MagnifyingGlassIcon />}>
                inspect
              </TabLink>
              <TabLink to="/generate" icon={<SparklesIcon />}>
                generate
              </TabLink>
            </nav>
            <div className="flex flex-row gap-2">
              {resultsLimited && (
                <Button
                  variant="quiet"
                  className="shrink-0"
                  onClick={() => {
                    handleLoadMore();
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
          <div className="flex-1 flex flex-col bg-stone-800">
            <Outlet />
          </div>
        </div>
      </AppContext.Provider>
      <Toaster />
    </div>
  );
}
