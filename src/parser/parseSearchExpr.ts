import { Token } from "../tokens";
import type { ParseContext } from "./ParseContext";
import {
  type FieldNameAST,
  parseFieldName,
  parseLiteral,
  parseOne,
  type StringAST,
} from "./parseCommon";
import { type ExpressionAST, parseExpr } from "./parseExpr";

export type SearchExpressionAST = StringAST | CompareExpressionAST;

export function parseSearchExpr(ctx: ParseContext): SearchExpressionAST {
  return parseOne(ctx, parseCompareExpr);
}

export type CompareOp = "=" | ">" | "<" | ">=" | "<=" | "!=";

export type CompareExpressionAST = {
  type: "compare";
  left: FieldNameAST;
  op: CompareOp;
  right: ExpressionAST;
};

function parseCompareExpr(ctx: ParseContext): CompareExpressionAST {
  const left = parseFieldName(ctx);
  const op = parseLiteral(
    ctx,
    [Token.operator, "="],
    [Token.operator, ">"],
    [Token.operator, "<"],
    [Token.operator, ">="],
    [Token.operator, "<="],
    [Token.operator, "!="],
  );
  const right = parseExpr(ctx);

  return {
    type: "compare",
    left,
    op,
    right,
  };
}
