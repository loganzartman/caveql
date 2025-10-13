import * as webllm from "@mlc-ai/web-llm";
import { queryASTSchema } from "caveql";
import dedent from "dedent";
import { useCallback, useRef, useState } from "react";
import * as z from "zod";
import { Button } from "./components/Button";
import { ConfirmDownloadDialog } from "./components/ConfirmDownloadDialog";

const modelID = "Qwen3-1.7B-q4f16_1-MLC";

const appConfig: webllm.AppConfig = webllm.prebuiltAppConfig;

const jsonSchema = z.toJSONSchema(queryASTSchema, {
  unrepresentable: "any",
  override: (ctx) => {
    const def = ctx.zodSchema._zod.def;
    if (def.type === "bigint") {
      ctx.jsonSchema = {
        type: "number",
      };
    }
  },
});

export function GenerateTab({
  onAcceptQuery,
}: {
  onAcceptQuery: (query: string) => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isShowingConfirmDownload, setIsShowingConfirmDownload] =
    useState(false);
  const [preloadProgress, setPreloadProgress] = useState<number | null>(null);
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
        setIsGenerating(true);
        await getEngine();

        setIsShowingConfirmDownload(false);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [getEngine]);

  const generate = useCallback(() => {
    if (isGenerating) {
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
        setIsGenerating(true);

        const engine = await getEngine();
        const chunks = await engine.chat.completions.create({
          messages: [
            {
              role: "system",
              content: dedent`
                You are a Splunk expert. Your job is to write Splunk queries to achieve the user's request.
                The user will make a request. You should respond with only a Splunk query AST, and no additional commentary or formatting.
                The Splunk query AST is as follows:

                ${JSON.stringify(jsonSchema, null, 2)}
              `,
            },
            {
              role: "user",
              content: `${request}`,
            },
          ],
          extra_body: {
            enable_thinking: false,
          },
          temperature: 0.7,
          top_p: 0.8,
          max_tokens: 2000,
          stream: true,
          stream_options: { include_usage: true },
        });

        for await (const chunk of chunks) {
          setGenerated((g) => g + (chunk.choices[0]?.delta.content || ""));
          console.log(chunk);
          if (chunk.usage) {
            console.log(chunk.usage); // only last chunk has usage
          }
        }

        setIsGenerating(false);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [isGenerating, getEngine]);

  return (
    <div className="p-4">
      <div className="text-xl font-semibold mb-2">What do you want to do?</div>
      <textarea
        ref={textareaRef}
        className="w-full p-2 border border-stone-500"
        placeholder="Find the average duration of successful requests"
      ></textarea>
      <Button
        onClick={() => !isGenerating && generate()}
        disabled={isGenerating}
        variant="filled-2"
      >
        generate
      </Button>
      <pre className="text-wrap break-all">{generated}</pre>
      {generated !== "" && !isGenerating && (
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
