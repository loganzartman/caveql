import { Token } from "../tokens";
import type { ParseContext } from "./ParseContext";
import {
  type FieldNameAST,
  type NumericAST,
  parseFieldName,
  parseLiteral,
  parseNumeric,
  parseOne,
  parseRex,
  parseString,
  parseWs,
  type StringAST,
} from "./parseCommon";
import type { ExpressionAST } from "./parseExpression";

export type SearchExpressionAST =
  | SearchBinaryExpressionAST
  | SearchUnaryExpressionAST
  | CompareExpressionAST
  | StringAST
  | NumericAST;

export function parseSearchExpression(ctx: ParseContext): SearchExpressionAST {
  return parseSearchOrExpression(ctx);
}

function parseSearchOrExpression(ctx: ParseContext): SearchExpressionAST {
  return parseBooleanBinaryLevel(ctx, parseSearchAndExpression, ["OR"]);
}

function parseSearchAndExpression(ctx: ParseContext): SearchExpressionAST {
  return parseBooleanBinaryLevel(ctx, parseSearchUnaryOp, ["AND"]);
}

export type SearchBinaryOp = "AND" | "OR";
export type SearchBinaryExpressionAST = {
  type: "search-binary-op";
  op: SearchBinaryOp;
  left: SearchExpressionAST;
  right: SearchExpressionAST;
};

export type SearchUnaryOp = "NOT";
export type SearchUnaryExpressionAST = {
  type: "search-unary-op";
  op: SearchUnaryOp;
  operand: SearchExpressionAST;
};

function parseBooleanBinaryLevel(
  ctx: ParseContext,
  parseNextLevel: (ctx: ParseContext) => SearchExpressionAST,
  ops: SearchBinaryOp[],
): SearchExpressionAST {
  parseWs(ctx);
  let left = parseNextLevel(ctx);

  while (true) {
    try {
      parseWs(ctx);
      const op = parseLiteral(
        ctx,
        ...ops.map((op) => [Token.operator, op] as [Token, SearchBinaryOp]),
      );
      parseWs(ctx);
      const right = parseNextLevel(ctx);
      left = {
        type: "search-binary-op",
        op,
        left,
        right,
      };
    } catch {
      break;
    }
  }

  return left;
}

function parseSearchUnaryOp(ctx: ParseContext): SearchExpressionAST {
  try {
    parseWs(ctx);
    const op = parseLiteral(ctx, [Token.operator, "NOT"]);

    parseWs(ctx);
    const operand = parseSearchOrExpression(ctx);
    return {
      type: "search-unary-op",
      op,
      operand,
    };
  } catch {
    return parseSearchTerm(ctx);
  }
}

function parseSearchTerm(ctx: ParseContext): SearchExpressionAST {
  return parseOne(
    ctx,
    parseSearchGroup,
    parseCompareExpression,
    parseSearchString,
    parseNumeric,
  );
}

function parseSearchGroup(ctx: ParseContext): SearchExpressionAST {
  parseWs(ctx);
  parseLiteral(ctx, [Token.paren, "("]);
  parseWs(ctx);
  const expr = parseSearchExpression(ctx);
  parseWs(ctx);
  parseLiteral(ctx, [Token.paren, ")"]);
  return expr;
}

export type CompareOp = "=" | ">" | "<" | ">=" | "<=" | "!=";

export type CompareExpressionAST = {
  type: "compare";
  left: FieldNameAST;
  op: CompareOp;
  right: ExpressionAST;
};

function parseCompareExpression(ctx: ParseContext): CompareExpressionAST {
  parseWs(ctx);
  const left = parseFieldName(ctx);
  parseWs(ctx);
  const op = parseLiteral(
    ctx,
    [Token.operator, ">="],
    [Token.operator, "<="],
    [Token.operator, "!="],
    [Token.operator, "="],
    [Token.operator, ">"],
    [Token.operator, "<"],
  );
  parseWs(ctx);
  const right = parseOne(ctx, parseSearchString, parseNumeric);

  return {
    type: "compare",
    left,
    op,
    right,
  };
}

function parseSearchString(ctx: ParseContext): StringAST {
  return parseOne(
    ctx,
    parseString,
    (c) =>
      ({
        type: "string",
        value: parseRex(c, Token.string, /[\p{L}$_][\p{L}\p{N}\-$_.]*/u),
      }) as const,
  );
}
