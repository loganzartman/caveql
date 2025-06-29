import {
  parseLiteral,
  parseString,
  parseWs,
  type StringAST,
} from "../parseCommon";
import type { ParseContext } from "../types";

export type AggregationTermType =
  | "count"
  | "distinct"
  | "sum"
  | "avg"
  | "min"
  | "max"
  | "mode"
  | "median"
  | "perc";

export type AggregationTermAST = {
  type: AggregationTermType;
  field?: StringAST;
};

export function parseAggregationTerm(ctx: ParseContext): AggregationTermAST {
  parseWs(ctx);
  const type = parseLiteral(
    ctx,
    "count",
    "distinct",
    "sum",
    "avg",
    "min",
    "max",
    "mode",
    "median",
    "perc",
  );

  let field: StringAST | undefined;
  try {
    parseWs(ctx);
    parseLiteral(ctx, "(");
    parseWs(ctx);
    field = parseString(ctx);
    parseWs(ctx);
    parseLiteral(ctx, ")");
  } catch {
    // pass
  }

  return { type, field };
}
