import type * as webllm from "@mlc-ai/web-llm";
import { grammarGBNF } from "./grammar";

export async function generatePlan({
  engine,
  request,
  fieldSet,
  onProgress,
}: {
  engine: webllm.MLCEngine;
  request: string;
  fieldSet: ReadonlySet<string>;
  onProgress?: (partialPlan: string) => void;
}): Promise<{ plan: string; usage: webllm.CompletionUsage | undefined }> {
  const input = makePlanInput({
    request,
    fields: Array.from(fieldSet),
  });
  const chunks = await engine.chat.completions.create(input);

  let plan = "";
  let usage: webllm.CompletionUsage | undefined;

  for await (const chunk of chunks) {
    const content = chunk.choices[0]?.delta.content || "";
    plan += content;
    onProgress?.(plan);
    if (chunk.usage) {
      usage = chunk.usage;
    }
  }

  return { plan, usage };
}

export async function generateQuery({
  engine,
  plan,
  onProgress,
}: {
  engine: webllm.MLCEngine;
  plan: string;
  onProgress?: (partialQuery: string) => void;
}): Promise<{ query: string; usage: webllm.CompletionUsage | undefined }> {
  const input = makeGenerateInput({ plan });
  const chunks = await engine.chat.completions.create(input);

  let query = "";
  let usage: webllm.CompletionUsage | undefined;

  for await (const chunk of chunks) {
    const content = chunk.choices[0]?.delta.content || "";
    query += content;
    onProgress?.(query);
    if (chunk.usage) {
      usage = chunk.usage;
    }
  }
  return { query, usage };
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
  {
    input: "show only the url and status fields",
    output: "| fields url, status",
  },
  {
    input: "create five sample events with a running id and static message",
    output:
      '| makeresults count=5\n| streamstats count as id\n| eval message="sample"',
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
          "AVAILABLE COMMANDS: search, where, rex, stats, sort, eval, fields, makeresults, streamstats",
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
    presence_penalty: 0.5,
    frequency_penalty: 0.5,
    temperature: 0.5,
    top_p: 0.9,
    max_tokens: 1024,
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
    presence_penalty: 0.3,
    frequency_penalty: 0.3,
    temperature: 0.3,
    top_p: 0.95,
    max_tokens: 384,
    stream: true,
    stream_options: { include_usage: true },
  } satisfies webllm.ChatCompletionRequest;
}
