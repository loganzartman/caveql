import type * as webllm from "@mlc-ai/web-llm";
import { removeThink } from "../../lib/removeThink";
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

export async function transcribeQuery({
  engine,
  plan,
  onProgress,
}: {
  engine: webllm.MLCEngine;
  plan: string;
  onProgress?: (partialQuery: string) => void;
}): Promise<{ query: string; usage: webllm.CompletionUsage | undefined }> {
  const input = makeTranscribeInput({ plan });
  const chunks = (await engine.chat.completions.create(
    input,
  )) as AsyncIterable<webllm.ChatCompletionChunk>;

  let query = "";
  let usage: webllm.CompletionUsage | undefined;

  for await (const chunk of chunks) {
    const content = chunk.choices[0]?.delta.content || "";
    query += content;
    onProgress?.(removeThink(query));
    if (chunk.usage) {
      usage = chunk.usage;
    }
  }
  return { query: removeThink(query), usage };
}

const fewShotExamples: Array<{ input: string; output: string }> = [
  {
    input: "find events where status equals 404",
    output:
      "Thinking: Simple equality filter. Use search command with a single comparison.\n\n| search status=404",
  },
  {
    input: "count events grouped by status code",
    output:
      "Thinking: Need to count occurrences per status. In Splunk stats, listing a field without an aggregation function acts as a grouping dimension. Plan: Use stats with count, and include status field to group by it.\n\n| stats count by status",
  },
  {
    input: "show requests with duration between 30 and 70 milliseconds",
    output:
      "Thinking: Range filter requires two conditions. Use search with AND logic: duration >= 30 AND duration <= 70.\n\n| search duration>=30 duration<=70",
  },
  {
    input: "calculate total and average duration for all requests",
    output:
      "Thinking: Multiple aggregations on the same field. Use stats with both sum and avg functions in one command.\n\n| stats sum(duration), avg(duration)",
  },
  {
    input: "find errors or warnings (status >= 400 or status equals 300)",
    output:
      "Thinking: Multiple conditions with OR logic. Use search command with explicit OR operator between two comparisons.\n\n| search status>=400 OR status=300",
  },
  {
    input: "add a field is_slow that's true when duration exceeds 100",
    output:
      "Thinking: Conditional logic to create a boolean field. Use eval with an if() function: if duration > 100 return true, else false.\n\n| eval is_slow=if(duration>100, true(), false())",
  },
  {
    input: "filter successful requests and sort by duration descending",
    output:
      "Thinking: Two-stage pipeline - filter then sort. Plan: 1) Use search to filter status=200, 2) Use sort with minus prefix for descending order.\n\n| search status=200\n| sort - duration",
  },
  {
    input: "extract username before @ symbol from email addresses",
    output:
      'Thinking: Regex extraction to capture text before @. Use rex with field parameter and a capture group named "username" that matches non-@ characters.\n\n| rex field=email "(?<username>[^@]+)@"',
  },
  {
    input: "calculate score as duration divided by 100, then show top scores",
    output:
      "Thinking: Three-stage pipeline. Plan: 1) Use eval to compute score field with division, 2) Sort by score descending, 3) Use fields to show only relevant columns.\n\n| eval score=duration/100\n| sort - score\n| fields request_id, duration, score",
  },
  {
    input: "find requests where method is not GET and status isn't 200",
    output:
      "Thinking: Multiple negation conditions with AND. Use search with NOT operators: NOT method=GET AND NOT status=200.\n\n| search NOT method=GET NOT status=200",
  },
  {
    input:
      "filter by expression: keep events where duration times 2 exceeds 150",
    output:
      "Thinking: Complex expression-based filtering. Search only handles simple comparisons, so use where command which supports arithmetic expressions.\n\n| where duration*2>150",
  },
  {
    input: "sort by status ascending then by duration descending",
    output:
      "Thinking: Multi-field sort with different directions. Use sort with + for ascending status (or no prefix since ascending is default), then - for descending duration.\n\n| sort + status, - duration",
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
          "The user will request to analyze their data.",
          "Think about each step required to manipulate the data using Splunk commands.",
          "Do not include an index. Do not include a sourcetype.",
          "Think about the user's intent, but do not doubt yourself.",
          "",
          `AVAILABLE FIELDS: ${fields.join(", ")}`,
          "AVAILABLE COMMANDS: search, where, rex, stats, sort, eval, fields, makeresults, streamstats",
        ].join("\n"),
      },
      ...fewShotExamples.flatMap(
        (example) =>
          [
            {
              role: "user",
              content: example.input,
            },
            {
              role: "assistant",
              content: example.output,
            },
          ] as const,
      ),
      {
        role: "user",
        content: request,
      },
    ],
    response_format: {
      type: "text",
    },
    presence_penalty: 0.5,
    frequency_penalty: 1.5,
    temperature: 0.3,
    top_p: 0.3,
    max_tokens: 1024,
    stream: true,
    stream_options: { include_usage: true },
  } satisfies webllm.ChatCompletionRequest;
}

function makeTranscribeInput({ plan }: { plan: string }) {
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
    extra_body: {
      enable_thinking: false,
    },
    presence_penalty: 0.3,
    frequency_penalty: 0.3,
    temperature: 0,
    top_p: 0.95,
    max_tokens: 384,
    stream: true,
    stream_options: { include_usage: true },
  } satisfies webllm.ChatCompletionRequest;
}
