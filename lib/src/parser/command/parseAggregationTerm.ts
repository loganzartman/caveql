import { Token } from "../../tokens";
import type { ParseContext } from "../ParseContext";
import {
  type FieldNameAST,
  parseFieldName,
  parseLiteral,
  parseRex,
  parseWs,
} from "../parseCommon";

export type AggregationTermType =
  | "count"
  | "distinct"
  | "sum"
  | "avg"
  | "min"
  | "max"
  | "range"
  | "var"
  | "stdev"
  | "mode"
  | "median"
  | "exactperc"
  | "perc";

export type AggregationTermAST =
  | {
      type: Exclude<AggregationTermType, "exactperc" | "perc">;
      field?: FieldNameAST;
      asField?: FieldNameAST;
    }
  | {
      type: "exactperc" | "perc";
      percentile: number;
      field?: FieldNameAST;
      asField?: FieldNameAST;
    };

export function parseAggregationTerm(ctx: ParseContext): AggregationTermAST {
  parseWs(ctx);
  let type = parseLiteral(
    ctx,
    [Token.function, "count"],
    [Token.function, "distinct"],
    [Token.function, "sum"],
    [Token.function, "avg"],
    [Token.function, "min"],
    [Token.function, "max"],
    [Token.function, "mode"],
    [Token.function, "range"],
    [Token.function, "var"],
    [Token.function, "stdev"],
    [Token.function, "median"],
    [Token.function, "exactperc"],
    [Token.function, "perc"],
    [Token.function, "p"],
  );

  if (type === "p") {
    type = "perc";
  }

  // special case for percentile aggregation; e.g. perc75(), p75()
  let percentile: number | undefined;
  if (type === "perc" || type === "exactperc") {
    const percentileStr = parseRex(ctx, Token.function, /\d{0,2}(\.\d*)?/);
    percentile = Number.parseFloat(percentileStr);
  }

  // optional field
  let field: FieldNameAST | undefined;
  try {
    parseWs(ctx);
    parseLiteral(ctx, [Token.paren, "("]);
    parseWs(ctx);
    field = parseFieldName(ctx);
    parseWs(ctx);
    parseLiteral(ctx, [Token.paren, ")"]);
  } catch {}

  // optional as clause
  let asField: FieldNameAST | undefined;
  try {
    parseWs(ctx);
    parseLiteral(ctx, [Token.keyword, "as"]);
    parseWs(ctx);
    asField = parseFieldName(ctx);
  } catch {}

  if (type === "perc" || type === "exactperc") {
    if (!percentile) {
      throw new Error(`${type}() aggregation requires a percentile`);
    }
    return { type, percentile, field, asField };
  }

  return { type, field, asField };
}
