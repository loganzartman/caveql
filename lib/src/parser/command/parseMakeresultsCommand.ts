import { z } from "zod";
import { Token } from "../../tokens";
import type { ParseContext } from "../ParseContext";
import {
  type NumericAST,
  numericASTSchema,
  parseLiteral,
  parseNumeric,
  parseOne,
  parseParam,
  parseString,
  parseWs,
  type StringAST,
  stringASTSchema,
} from "../parseCommon";

export const makeresultsCommandASTSchema = z.union([
  z.object({
    type: z.literal("makeresults"),
    count: numericASTSchema,
    format: z.undefined(),
    data: z.undefined(),
  }),
  z.object({
    type: z.literal("makeresults"),
    count: z.undefined(),
    format: z.enum(["csv", "json"]),
    data: stringASTSchema,
  }),
]);
export type MakeresultsCommandAST = z.infer<typeof makeresultsCommandASTSchema>;

export function parseMakeresultsCommand(
  ctx: ParseContext,
): MakeresultsCommandAST {
  parseWs(ctx);
  parseLiteral(ctx, [Token.command, "makeresults"]);

  let count: NumericAST = { type: "number", value: 1n };
  let format: "csv" | "json" | undefined;
  let data: StringAST | undefined;

  while (true) {
    try {
      parseWs(ctx);
      parseOne(
        ctx,
        (c) => {
          count = parseParam(c, "count", parseNumeric);
        },
        (c) => {
          format = parseParam(c, "format", (c) =>
            parseLiteral(c, [Token.string, "csv"], [Token.string, "json"]),
          );
        },
        (c) => {
          data = parseParam(c, "data", parseString);
        },
      );
    } catch {
      break;
    }
  }

  if (format !== undefined || data !== undefined) {
    if (format === undefined || data === undefined) {
      throw new Error("If format or data is specified, both must be specified");
    }
    return {
      type: "makeresults",
      count: undefined,
      format,
      data,
    };
  }
  return {
    type: "makeresults",
    count,
    format: undefined,
    data: undefined,
  };
}
