import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import * as webllm from "@mlc-ai/web-llm";
import { useCallback, useRef, useState } from "react";
import { Button } from "../../components/Button";
import { ConfirmDownloadDialog } from "../../components/ConfirmDownloadDialog";
import { LoadingStrip } from "../../components/LoadingStrip";
import { grammarGBNF } from "./grammar";

const appConfig: webllm.AppConfig = webllm.prebuiltAppConfig;
const availableModels = appConfig.model_list
  .filter((model) => model.model_type !== 1)
  .sort((a, b) => a.model_id.localeCompare(b.model_id));

export function GenerateTab({
  onAcceptQuery,
  fieldSet,
}: {
  onAcceptQuery: (query: string) => void;
  fieldSet: ReadonlySet<string>;
}) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const planContainerRef = useRef<HTMLPreElement | null>(null);
  const [isShowingConfirmDownload, setIsShowingConfirmDownload] =
    useState(false);
  const [preloadProgress, setPreloadProgress] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<
    "downloading" | "preparing" | "planning" | "generating" | "idle"
  >("idle");
  const [plan, setPlan] = useState("");
  const [generated, setGenerated] = useState("");
  const [modelID, setModelID] = useState(
    "Qwen2.5-Coder-3B-Instruct-q4f32_1-MLC",
  );

  const engineModel = useRef<string | null>(null);
  const engine = useRef<webllm.MLCEngine | null>(null);

  const getEngine = useCallback<() => Promise<webllm.MLCEngine>>(async () => {
    if (engine.current) {
      if (engineModel.current === modelID) {
        return engine.current;
      }
      await engine.current.unload();
      engine.current = null;
    }
    const newEngine = await webllm.CreateMLCEngine(modelID, {
      initProgressCallback: (progress) => {
        setPreloadProgress(progress.progress);
      },
    });
    engineModel.current = modelID;
    engine.current = newEngine;
    return newEngine;
  }, [modelID]);

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

        setPlan("");
        setGenerated("");
        setStatus("preparing");
        await new Promise((r) => requestAnimationFrame(r));

        const engine = await getEngine();

        setStatus("planning");

        let plan = "";
        {
          const input = makePlanInput({
            request,
            fields: Array.from(fieldSet),
          });
          console.log(input);
          const chunks = await engine.chat.completions.create(input);
          for await (const chunk of chunks) {
            const content = chunk.choices[0]?.delta.content || "";
            plan += content;
            setPlan(plan);
            planContainerRef.current?.scrollTo(
              0,
              planContainerRef.current.scrollHeight,
            );
            if (chunk.usage) {
              console.log(chunk.usage);
            }
          }
        }

        setStatus("generating");

        let generated = "";
        {
          const input = makeGenerateInput({ plan });
          console.log(input);
          const chunks = await engine.chat.completions.create(input);
          for await (const chunk of chunks) {
            const content = chunk.choices[0]?.delta.content || "";
            generated += content;
            setGenerated(generated);
            if (chunk.usage) {
              console.log(chunk.usage);
            }
          }
        }

        setGenerated(generated);
        setStatus("idle");
      } catch (e) {
        setErrorMessage(String(e));
        console.error(e);
      }
    })();
  }, [status, getEngine, modelID, fieldSet]);

  const confirmLoadModel = useCallback(() => {
    (async () => {
      try {
        setPreloadProgress(0);
        setStatus("downloading");
        await getEngine();

        setStatus("idle");
        setIsShowingConfirmDownload(false);

        generate();
      } catch (e) {
        setErrorMessage(String(e));
        console.error(e);
      }
    })();
  }, [getEngine, generate]);

  const renderProgressBar = () => {
    let text: string | null = null;
    switch (status) {
      case "preparing":
        text = "Getting ready...";
        break;
      case "planning":
        text = "Creating plan...";
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
      <div className="w-full flex flex-row items-center justify-between">
        <div className="flex flex-row items-center gap-3 mb-2">
          <div className="text-2xl font-semibold">what do you want to do?</div>
          <span className="text-xs bg-amber-800 text-amber-200 px-1 py-0.5 uppercase">
            Experimental
          </span>
        </div>
        <Listbox value={modelID} onChange={setModelID}>
          <div className="flex flex-row items-start">
            <ListboxButton className="w-full flex flex-row items-center gap-2 px-4 py-2 bg-stone-700">
              <ChevronDownIcon className="w-5 h-5 text-stone-400" />
              {modelID}
            </ListboxButton>
          </div>
          <ListboxOptions
            anchor="bottom end"
            className="ring-1 ring-amber-500/50"
          >
            {availableModels.map((model) => (
              <ListboxOption
                autoFocus
                key={model.model_id}
                value={model.model_id}
                className="cursor-pointer px-2 py-1 bg-stone-700 hover:bg-stone-600"
              >
                {model.model_id} (
                {model.vram_required_MB?.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}{" "}
                MB)
              </ListboxOption>
            ))}
          </ListboxOptions>
        </Listbox>
      </div>
      <textarea
        ref={textareaRef}
        className="w-full p-2 bg-stone-900"
        placeholder="Find the average duration of successful requests"
        defaultValue="count the total number of events"
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
      {errorMessage && (
        <pre className="text-red-300 font-sans">{errorMessage}</pre>
      )}
      <div
        style={{ display: plan ? "unset" : "none" }}
        className="flex flex-col w-full"
      >
        <span className="text-stone-900 bg-stone-500 uppercase text-sm px-2 py-0.5">
          Plan
        </span>
        <pre
          ref={planContainerRef}
          className="max-h-40 overflow-auto w-full p-2 border-l-1 border-stone-500 text-stone-400 font-sans italic text-wrap"
        >
          {plan}
        </pre>
      </div>
      <div
        style={{ display: generated ? "unset" : "none" }}
        className="flex flex-col w-full"
      >
        <span className="text-stone-900 bg-amber-500 uppercase text-sm px-2 py-0.5">
          Query
        </span>
        <pre className="max-h-40 w-full overflow-auto text-wrap break-all p-2 border-l-1 border-amber-500 text-amber-100">
          {generated}
        </pre>
      </div>
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

const fewShotExamples: Array<{ input: string; output: string }> = [
  {
    input: "find events where status equals 404",
    output: "| search status=404",
  },
  {
    input: "count the number of requests with 2xx status",
    output: "| search status>=200 status<300\n| stats count",
  },
  {
    input: "extract the path from the url field",
    output: '| rex field=url "[a-z]+:/+[^/]+/(?<path>[^?]+)"',
  },
  {
    input: "calculate average DB and CPU duration of requests",
    output: "| stats avg(db_duration), avg(cpu_duration)",
  },
  {
    input: "sort events by response_time descending",
    output: "| sort - response_time",
  },
];

function makePlanInput({
  request,
  fields,
}: {
  request: string;
  fields: string[];
}) {
  return {
    messages: [
      {
        role: "system",
        content: [
          "You are a Splunk expert. You analyze user requests and then generate a Splunk query.",
          "Remember that Splunk queries are a sequence of commands. Each command starts with a |",
          "Commands go in this order: filter, transform, aggregate/sort.",
          "",
          "EXAMPLES:",
          ...fewShotExamples.flatMap((example) => [
            `Goal: ${example.input}`,
            `Query: ${example.output}`,
            "",
          ]),
          "",
          `AVAILABLE FIELDS: ${fields.join(", ")}`,
          "AVAILABLE COMMANDS: search, where, rex, stats, sort",
          "",
          "The user will make a request. Make a plan and implement the request.",
          "Do not include an index. Do not include a sourcetype.",
          "Do no more than necessary to fulfill the request.",
        ].join("\n"),
      },
      {
        role: "user",
        content: request,
      },
    ],
    response_format: {
      type: "text",
    },
    presence_penalty: 1,
    frequency_penalty: 1,
    temperature: 0.7,
    top_p: 0.8,
    max_tokens: 512,
    stream: true,
    stream_options: { include_usage: true },
  } satisfies webllm.ChatCompletionRequest;
}

function makeGenerateInput({ plan }: { plan: string }) {
  return {
    messages: [
      {
        role: "system",
        content: [
          "You are a Splunk autocomplete engine.",
          "Remember that Splunk queries are a sequence of commands. Each command starts with a |",
          "",
          "The user inputs a plan, and you extract a valid Splunk query.",
          "You ignore invalid syntax.",
          "You never explain yourself. You only output the Splunk query.",
        ].join("\n"),
      },
      {
        role: "user",
        content: plan,
      },
    ],
    response_format: {
      type: "grammar",
      grammar: grammarGBNF,
    },
    presence_penalty: 1,
    frequency_penalty: 1,
    temperature: 0.7,
    top_p: 1.0,
    max_tokens: 256,
    stream: true,
    stream_options: { include_usage: true },
  } satisfies webllm.ChatCompletionRequest;
}
