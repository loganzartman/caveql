import {
  type NumericAST,
  parseLiteral,
  parseWs,
  type StringAST,
} from "../parseCommon";
import { type ExpressionAST, parseExpr } from "../parseExpr";
import type { ParseContext } from "../types";

export type WhereCommandAST = {
  type: "where";
  expr: ExpressionAST;
};

export function parseWhereCommand(ctx: ParseContext): WhereCommandAST {
  parseWs(ctx);
  parseLiteral(ctx, "where");
  parseWs(ctx);
  const expr = parseExpr(ctx);
  return { type: "where", expr };
}

export type MakeresultsCommandAST = {
  type: "makeresults";
  count: NumericAST;
} & (
  | {
      format: "csv" | "json";
      data: StringAST;
    }
  | {
      format?: undefined;
      data?: undefined;
    }
);
