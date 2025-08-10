import { Token } from "../../tokens";
import type { ParseContext } from "../ParseContext";
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

export type MakeresultsCommandAST = {
  type: "makeresults";
} & (
  | {
      count?: undefined;
      format: "csv" | "json";
      data: StringAST;
    }
  | {
      count: NumericAST;
      format?: undefined;
      data?: undefined;
    }
);

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
      format,
      data,
    };
  }
  return {
    type: "makeresults",
    count,
  };
}
