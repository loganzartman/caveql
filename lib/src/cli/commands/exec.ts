import { buildCommand } from "@stricli/core";
import { compileQuery } from "../../compiler";
import { parseInputPath } from "../../data/inputPath";
import { readRecords } from "../../data/readRecords";
import { parseQuery } from "../../parser";

type Flags = {
  inputPath: string[] | undefined;
};

export const execCommand = buildCommand({
  func: async (flags: Flags, query: string) => {
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
        brief: "Input file path",
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
        },
      ],
    },
  },

  docs: {
    brief: "Execute a query on a file",
  },
});
