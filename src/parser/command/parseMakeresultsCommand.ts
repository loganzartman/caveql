import {
  type NumericAST,
  parseLiteral,
  parseNumeric,
  parseOne,
  parseParam,
  parseString,
  parseWs,
  type StringAST,
} from "../parseCommon";
import type { ParseContext } from "../types";
import type { MakeresultsCommandAST } from "./parseWhereCommand";

export function parseMakeresultsCommand(
  ctx: ParseContext,
): MakeresultsCommandAST {
  parseWs(ctx);
  parseLiteral(ctx, "makeresults");

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
            parseLiteral(c, "csv", "json"),
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
      count,
      format,
      data,
    };
  }
  return {
    type: "makeresults",
    count,
  };
}
