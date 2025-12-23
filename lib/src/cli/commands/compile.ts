import { buildCommand } from "@stricli/core";
import { compileQuery } from "../../compiler/compileQuery";
import { parseQuery } from "../../parser";

export const commandCompile = buildCommand({
  func: async (_flags: object, query: string) => {
    const parsed = parseQuery(query);
    const compiled = compileQuery(parsed.ast);
    console.log(compiled.source);
  },
  parameters: {
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
    brief: "Compile a query",
  },
});
