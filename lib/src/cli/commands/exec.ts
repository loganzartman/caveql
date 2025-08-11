import { readFile } from "node:fs/promises";
import { buildCommand } from "@stricli/core";
import { compileQuery } from "../../compiler";
import { parseQuery } from "../../parser";

type Flags = {
  inputFile: string[] | undefined;
};

export const execCommand = buildCommand({
  func: async (flags: Flags, query: string) => {
    const inputFiles = flags.inputFile ?? [];

    const inputs = await Promise.all(
      inputFiles.map((f) => readFile(f, { encoding: "utf-8" })),
    );
    const inputsJSON = inputs.map((input) => JSON.parse(input));
    if (inputsJSON.some((input) => !Array.isArray(input))) {
      throw new Error("Only JSON arrays are supported");
    }

    const inputRecords = Array.prototype.concat(inputsJSON);
    const parsed = parseQuery(query);
    const run = compileQuery(parsed.ast);

    for (const record of run(inputRecords)) {
      console.log(JSON.stringify(record));
    }
  },

  parameters: {
    aliases: {
      i: "inputFile",
    },
    flags: {
      inputFile: {
        brief: "Input file",
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
