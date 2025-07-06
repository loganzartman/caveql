import { Token } from "../../tokens";
import type { ParseContext } from "../ParseContext";
import {
  type FieldNameAST,
  parseFieldName,
  parseLiteral,
  parseWs,
} from "../parseCommon";

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
  field?: FieldNameAST;
};

export function parseAggregationTerm(ctx: ParseContext): AggregationTermAST {
  parseWs(ctx);
  const type = parseLiteral(
    ctx,
    [Token.function, "count"],
    [Token.function, "distinct"],
    [Token.function, "sum"],
    [Token.function, "avg"],
    [Token.function, "min"],
    [Token.function, "max"],
    [Token.function, "mode"],
    [Token.function, "median"],
    [Token.function, "perc"],
  );

  let field: FieldNameAST | undefined;
  try {
    parseWs(ctx);
    parseLiteral(ctx, [Token.paren, "("]);
    parseWs(ctx);
    field = parseFieldName(ctx);
    parseWs(ctx);
    parseLiteral(ctx, [Token.paren, ")"]);
  } catch {
    // pass
  }

  return { type, field };
}
