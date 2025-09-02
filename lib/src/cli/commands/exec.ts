import { buildCommand } from "@stricli/core";
import { compileQuery } from "../../compiler";
import { parseInputPath } from "../../data/parseInputPath";
import { readRecords } from "../../data/readRecords";
import { parseQuery } from "../../parser";

type Flags = {
  inputPath: string[] | undefined;
};

export const execCommand = buildCommand({
  func: async (flags: Flags, query: string) => {
    if (!flags.inputPath && !query) {
      console.error("[warn] no query or inputs specified.");
    }

    const inputPaths = flags.inputPath ?? [];
    const dataSources = inputPaths.map(parseInputPath);
    const inputs = dataSources.map((source) => readRecords(source));

    const combinedInput = (async function* () {
      for (const input of inputs) {
        yield* input;
      }
    })();

    const parsed = parseQuery(query);
    const run = compileQuery(parsed.ast);

    for await (const record of run(combinedInput)) {
      console.log(JSON.stringify(record));
    }
  },

  parameters: {
    aliases: {
      i: "inputPath",
    },
    flags: {
      inputPath: {
        brief: "Input file path with optional format query",
        kind: "parsed",
        optional: true,
        variadic: true,
        parse: String,
      },
    },
    positional: {
      kind: "tuple",
      parameters: [
        {
          brief: "Query",
          parse: String,
          placeholder: "query",
          default: "",
        },
      ],
    },
  },

  docs: {
    brief: "Execute a query on the given input files",
    fullDescription: [
      "Run a caveql query.",
      "See https://github.com/loganzartman/caveql for more information.",
      "",
      "Most queries will operate on one or more input files, specified using the --inputFile or -i flag. Some queries may generate results without any input. Providing multiple input files will concatenate their parsed contents.",
      "",
      "The format of an input file is inferred based on its extension. Supported formats are JSON, JSONL/NDJSON, and CSV. It's also possible to specify the format using a query string:",
      "  file.ext?type=json&stream",
      "",
      "The supported format parameters are:",
      "  type: json, csv     - how to parse the file",
      "  stream: true, false - setting stream=true enables JSONL/NDJSON",
      "",
      "caveql does NOT yet support piped input from stdin.",
      "",
      "caveql always outputs streaming JSON, which can be piped to tools like `jq`.",
      "",
      "EXAMPLES",
      "  caveql -i data.json 'value > 10'",
      "  caveql -i data.csv 'name = Alice'",
      "  caveql -i data1.csv -i 'data2.json?stream' '| stats sum(value)'",
      "  caveql '| makeresults count=10 | streamstats count'",
    ].join("\n"),
  },
});
