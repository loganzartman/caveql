import * as webllm from "@mlc-ai/web-llm";
import { printAST, type QueryAST, queryASTSchema } from "caveql";
import { useCallback, useRef, useState } from "react";
import * as z from "zod";
import { Button } from "./components/Button";
import { ConfirmDownloadDialog } from "./components/ConfirmDownloadDialog";
import { LoadingStrip } from "./components/LoadingStrip";

// Qwen3 1.7B struggles with syntax (seems to break structured generation??)
// Qwen2.5-Coder-1.5B is workable but makes some mistakes.
// Qwen2.5-Coder-3B is effective.
// const modelID = "Qwen2.5-Coder-1.5B-Instruct-q4f32_1-MLC";
const modelID = "Qwen2.5-Coder-3B-Instruct-q4f16_1-MLC";

const appConfig: webllm.AppConfig = webllm.prebuiltAppConfig;
console.log(appConfig);

const jsonSchema = z.toJSONSchema(queryASTSchema, {
  unrepresentable: "any",
  target: "draft-7",
});

export function GenerateTab({
  onAcceptQuery,
}: {
  onAcceptQuery: (query: string) => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [isShowingConfirmDownload, setIsShowingConfirmDownload] =
    useState(false);
  const [preloadProgress, setPreloadProgress] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<
    "downloading" | "preparing" | "generating" | "idle"
  >("idle");
  const [generated, setGenerated] = useState("");
  const engine = useRef<webllm.MLCEngine | null>(null);

  const getEngine = useCallback<() => Promise<webllm.MLCEngine>>(async () => {
    if (engine.current) {
      return engine.current;
    }
    const newEngine = await webllm.CreateMLCEngine(modelID, {
      initProgressCallback: (progress) => {
        setPreloadProgress(progress.progress);
      },
    });
    engine.current = newEngine;
    return newEngine;
  }, []);

  const confirmLoadModel = useCallback(() => {
    (async () => {
      try {
        setPreloadProgress(0);
        setStatus("downloading");
        await getEngine();

        setStatus("idle");
        setIsShowingConfirmDownload(false);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [getEngine]);

  const generate = useCallback(() => {
    if (status !== "idle") {
      return;
    }

    const request = textareaRef.current?.value;
    if (!request) {
      return;
    }

    (async () => {
      try {
        if (!(await webllm.hasModelInCache(modelID, appConfig))) {
          setPreloadProgress(null);
          setIsShowingConfirmDownload(true);
          return;
        }

        setGenerated("");
        setStatus("preparing");
        await new Promise((r) => requestAnimationFrame(r));

        const engine = await getEngine();
        const input = makeCompletionInput({ request });
        console.log(input);
        const chunks = await engine.chat.completions.create(input);

        setStatus("generating");

        let generated = "";
        for await (const chunk of chunks) {
          const content = chunk.choices[0]?.delta.content || "";
          generated += content;
          if (chunk.usage) {
            console.log(chunk.usage); // only last chunk has usage
          }
        }

        try {
          const parsed = JSON.parse(generated);
          const printed = printAST(parsed);
          setGenerated(printed);
        } catch (e) {
          console.error("Output:\n", generated);
          console.error(e);
          setErrorMessage("LLM failed to produce valid output");
        }

        setStatus("idle");
      } catch (e) {
        console.error(e);
      }
    })();
  }, [status, getEngine]);

  const renderProgressBar = () => {
    let text: string | null = null;
    switch (status) {
      case "preparing":
        text = "Getting ready...";
        break;
      case "generating":
        text = "Generating...";
        break;
    }

    if (!text) {
      return null;
    }

    return (
      <div className="my-1 flex flex-col gap-1">
        <div>{text}</div>
        <LoadingStrip isLoading />
      </div>
    );
  };

  return (
    <div className="p-4 flex flex-col gap-2 items-start">
      <div className="flex flex-row items-center gap-3 mb-2">
        <div className="text-2xl font-semibold">what do you want to do?</div>
        <span className="text-xs bg-amber-800 text-amber-200 px-1 py-0.5 uppercase">
          Experimental
        </span>
      </div>
      <textarea
        ref={textareaRef}
        className="w-full p-2 border border-stone-500"
        placeholder="Find the average duration of successful requests"
      ></textarea>
      <Button
        onClick={() => status === "idle" && generate()}
        disabled={status !== "idle"}
        variant="filled-2"
        className="mb-2"
      >
        generate query
      </Button>
      {renderProgressBar()}
      {errorMessage && <div className="text-red-300">{errorMessage}</div>}
      <pre className="text-wrap break-all">{generated}</pre>
      {generated !== "" && status === "idle" && (
        <Button variant="filled-2" onClick={() => onAcceptQuery(generated)}>
          use query
        </Button>
      )}
      <ConfirmDownloadDialog
        isOpen={isShowingConfirmDownload}
        onClose={() =>
          preloadProgress === null && setIsShowingConfirmDownload(false)
        }
        onConfirm={() => confirmLoadModel()}
        progress={preloadProgress}
      />
    </div>
  );
}

const fewShotExamples: Array<{ input: string; output: QueryAST }> = [
  // 1. SIMPLE: Basic search with single comparison
  {
    input: "find events where status equals 404",
    output: {
      type: "query",
      pipeline: [
        {
          type: "search",
          filters: [
            {
              type: "compare",
              left: { type: "field-name", value: "status" },
              op: "=",
              right: { type: "number", value: 404 },
            },
          ],
        },
      ],
    },
  },

  // 2. SIMPLE: Search with AND condition
  {
    input: "show errors from the web server",
    output: {
      type: "query",
      pipeline: [
        {
          type: "search",
          filters: [
            {
              type: "search-binary-op",
              op: "AND",
              left: {
                type: "compare",
                left: { type: "field-name", value: "level" },
                op: "=",
                right: { type: "string", value: "error" },
              },
              right: {
                type: "compare",
                left: { type: "field-name", value: "source" },
                op: "=",
                right: { type: "string", value: "web" },
              },
            },
          ],
        },
      ],
    },
  },

  // 3. MEDIUM: Search + stats aggregation
  {
    input: "count events by host",
    output: {
      type: "query",
      pipeline: [
        {
          type: "stats",
          aggregations: [
            {
              type: "count",
            },
          ],
        },
      ],
    },
  },

  // 4. MEDIUM: Stats with grouping (by field)
  {
    input: "calculate average response time by endpoint",
    output: {
      type: "query",
      pipeline: [
        {
          type: "stats",
          aggregations: [
            {
              type: "avg",
              field: { type: "field-name", value: "response_time" },
              asField: { type: "field-name", value: "avg_response_time" },
            },
          ],
        },
      ],
    },
  },

  // 5. COMPLEX: Search + sort with limit
  {
    input: "find the top 10 slowest requests",
    output: {
      type: "query",
      pipeline: [
        {
          type: "sort",
          count: { type: "number", value: 10 },
          fields: [
            {
              type: "sort-field",
              field: { type: "field-name", value: "duration" },
              desc: true,
            },
          ],
        },
      ],
    },
  },

  // 6. COMPLEX: Multi-stage pipeline
  {
    input: "find errors, count them by severity, and show the top 5",
    output: {
      type: "query",
      pipeline: [
        {
          type: "search",
          filters: [
            {
              type: "compare",
              left: { type: "field-name", value: "level" },
              op: "=",
              right: { type: "string", value: "error" },
            },
          ],
        },
        {
          type: "stats",
          aggregations: [
            {
              type: "count",
              asField: { type: "field-name", value: "error_count" },
            },
          ],
        },
        {
          type: "sort",
          count: { type: "number", value: 5 },
          fields: [
            {
              type: "sort-field",
              field: { type: "field-name", value: "error_count" },
              desc: true,
            },
          ],
        },
      ],
    },
  },

  // 7. EDGE CASE: eval with expression
  {
    input:
      "create a field called is_slow that's true when duration is over 1000",
    output: {
      type: "query",
      pipeline: [
        {
          type: "eval",
          bindings: [
            [
              { type: "field-name", value: "is_slow" },
              {
                type: "binary-op",
                op: ">",
                left: { type: "field-name", value: "duration" },
                right: { type: "number", value: 1000 },
              },
            ],
          ],
        },
      ],
    },
  },
];

function makeCompletionInput({ request }: { request: string }) {
  return {
    messages: [
      {
        role: "system",
        content: [
          "The user will make a request and you will respond with a Splunk query AST.",
          "",
          fewShotExamples.map((ex) => [
            "EXAMPLE:",
            `Input: ${ex.input}`,
            `Output: ${JSON.stringify(ex.output, null, 2)}`,
          ]),
          "",
          "As a Splunk expert, respond with a JSON-formatted Splunk query AST, and nothing else.",
          "If you're missing information to create a working query, use sample values.",
        ]
          .flat()
          .join("\n"),
      },
      {
        role: "user",
        content: `/no_think ${request}`,
      },
    ],
    response_format: {
      type: "json_object",
      // schema: JSON.stringify(jsonSchema),
    },
    temperature: 0.7,
    top_p: 0.8,
    max_tokens: 256,
    stream: true,
    stream_options: { include_usage: true },
  } satisfies webllm.ChatCompletionRequest;
}
