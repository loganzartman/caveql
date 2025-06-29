import {
  type NumericAST,
  parseLiteral,
  parseNumeric,
  parseOne,
  parseString,
  parseWs,
  type StringAST,
} from "./parseCommon";
import type { ParseContext } from "./types";

export type ExpressionAST = UnaryOpAST | BinaryOpAST | NumericAST | StringAST;

export function parseExpr(ctx: ParseContext): ExpressionAST {
  return parseOrExpr(ctx);
}

export function parseTerm(ctx: ParseContext): ExpressionAST {
  return parseOne(ctx, parseGroup, parseNumeric, parseString);
}

export type BinaryOpType =
  | "and"
  | "or"
  | "AND"
  | "OR"
  | "="
  | "=="
  | ">"
  | "<"
  | ">="
  | "<="
  | "!="
  | "+"
  | "-"
  | "*"
  | "/"
  | "%";

export type BinaryOpAST = {
  type: BinaryOpType;
  left: ExpressionAST;
  right: ExpressionAST;
};

function parseOrExpr(ctx: ParseContext): ExpressionAST {
  if (ctx.compareExpr) {
    return parseBinaryLevel(ctx, parseAndExpr, ["OR"]);
  }
  return parseBinaryLevel(ctx, parseAndExpr, ["or"]);
}

function parseAndExpr(ctx: ParseContext): ExpressionAST {
  if (ctx.compareExpr) {
    return parseBinaryLevel(ctx, parseEqualityExpr, ["AND"]);
  }
  return parseBinaryLevel(ctx, parseEqualityExpr, ["and"]);
}

function parseEqualityExpr(ctx: ParseContext): ExpressionAST {
  return parseBinaryLevel(ctx, parseComparisonExpr, ["!=", "==", "="]);
}

function parseComparisonExpr(ctx: ParseContext): ExpressionAST {
  return parseBinaryLevel(ctx, parseAdditiveExpr, [">=", "<=", ">", "<"]);
}

function parseAdditiveExpr(ctx: ParseContext): ExpressionAST {
  return parseBinaryLevel(ctx, parseMultiplicativeExpr, ["+", "-"]);
}

function parseMultiplicativeExpr(ctx: ParseContext): ExpressionAST {
  return parseBinaryLevel(ctx, parseUnaryExpr, ["*", "/", "%"]);
}

function parseBinaryLevel(
  ctx: ParseContext,
  nextLevel: (ctx: ParseContext) => ExpressionAST,
  operators: BinaryOpType[],
): ExpressionAST {
  let left = nextLevel(ctx);

  while (true) {
    try {
      parseWs(ctx);
      const op = parseLiteral(ctx, ...operators);
      parseWs(ctx);
      const right = nextLevel(ctx);
      left = {
        type: op as BinaryOpType,
        left,
        right,
      };
    } catch {
      break;
    }
  }

  return left;
}

export type UnaryOpType = "not" | "NOT";

export type UnaryOpAST = {
  type: UnaryOpType;
  operand: ExpressionAST;
};

export function parseUnaryExpr(ctx: ParseContext): ExpressionAST {
  try {
    parseWs(ctx);
    let op: UnaryOpType;
    if (ctx.compareExpr) {
      op = parseLiteral(ctx, "NOT");
    } else {
      op = parseLiteral(ctx, "not");
    }

    parseWs(ctx);
    const operand = parseExpr(ctx);
    return {
      type: op,
      operand,
    };
  } catch {
    return parseTerm(ctx);
  }
}

export function parseGroup(ctx: ParseContext): ExpressionAST {
  parseWs(ctx);
  parseLiteral(ctx, "(");
  parseWs(ctx);
  const expr = parseExpr(ctx);
  parseWs(ctx);
  parseLiteral(ctx, ")");
  return expr;
}
