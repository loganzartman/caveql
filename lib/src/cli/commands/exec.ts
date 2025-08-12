import { buildCommand } from "@stricli/core";
import { z } from "zod";
import { compileQuery } from "../../compiler";
import { type DataSource, readDataSource } from "../../data/dataSource";
import { parseQuery } from "../../parser";

type Flags = {
  inputFile: string[] | undefined;
};

export const execCommand = buildCommand({
  func: async (flags: Flags, query: string) => {
    const inputFiles = flags.inputFile ?? [];

    const inputs = await Promise.all(
      inputFiles.map(parseInputFile).map(readDataSource),
    );

    const parsed = parseQuery(query);
    const run = compileQuery(parsed.ast);
    console.log(run.source);

    for await (const record of run(inputs[0])) {
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

const fileFormatSchema = z.union([z.literal("json"), z.literal("csv")]);
type FileFormat = z.infer<typeof fileFormatSchema>;

function parseInputFile(uri: string): DataSource {
  const parts = uri.split("?");
  const path = parts[0];
  const query = parts[1]
    ? new URLSearchParams(parts[1])
    : new URLSearchParams();

  const format = query.has("format")
    ? fileFormatSchema.parse(query.get("format"))
    : guessFormat(path);

  return {
    type: "file",
    file: new File([path], path),
    format: {
      type: format,
    },
  } satisfies DataSource;
}

function guessFormat(path: string): FileFormat {
  const extension = path.split(".").at(-1);
  if (extension === "json") return "json";
  if (extension === "csv") return "csv";
  return "csv";
}
