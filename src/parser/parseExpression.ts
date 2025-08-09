import { type BuiltinFuncName, builtinFuncs } from "../compiler";
import { Token } from "../tokens";
import type { ParseContext } from "./ParseContext";
import {
  type FieldNameAST,
  type NumericAST,
  parseFieldName,
  parseLiteral,
  parseNumeric,
  parseOne,
  parseOptional,
  parseString,
  parseWs,
  type StringAST,
} from "./parseCommon";

export type ExpressionAST =
  | UnaryOpAST
  | BinaryOpAST
  | FunctionCallAST
  | NumericAST
  | StringAST
  | FieldNameAST;

export function parseExpression(ctx: ParseContext): ExpressionAST {
  return parseOrExpr(ctx);
}

export function parseTerm(ctx: ParseContext): ExpressionAST {
  return parseOne(
    ctx,
    parseFunctionCall,
    parseGroup,
    parseNumeric,
    parseString,
    parseFieldName,
  );
}

export type BinaryOp =
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
  | "%"
  | ".";

export type BinaryOpAST = {
  type: "binary-op";
  op: BinaryOp;
  left: ExpressionAST;
  right: ExpressionAST;
};

function parseOrExpr(ctx: ParseContext): ExpressionAST {
  return parseBinaryLevel(ctx, parseAndExpr, ["or"]);
}

function parseAndExpr(ctx: ParseContext): ExpressionAST {
  return parseBinaryLevel(ctx, parseEqualityExpr, ["and"]);
}

function parseEqualityExpr(ctx: ParseContext): ExpressionAST {
  return parseBinaryLevel(ctx, parseComparisonExpr, ["!=", "==", "="]);
}

function parseComparisonExpr(ctx: ParseContext): ExpressionAST {
  return parseBinaryLevel(ctx, parseAdditiveExpr, [">=", "<=", ">", "<"]);
}

function parseAdditiveExpr(ctx: ParseContext): ExpressionAST {
  return parseBinaryLevel(ctx, parseMultiplicativeExpr, ["+", "-", "."]);
}

function parseMultiplicativeExpr(ctx: ParseContext): ExpressionAST {
  return parseBinaryLevel(ctx, parseUnaryExpr, ["*", "/", "%"]);
}

function parseBinaryLevel(
  ctx: ParseContext,
  nextLevel: (ctx: ParseContext) => ExpressionAST,
  operators: BinaryOp[],
): ExpressionAST {
  let left = nextLevel(ctx);

  while (true) {
    try {
      parseWs(ctx);
      const op = parseLiteral(
        ctx,
        ...operators.map((o) => [Token.operator, o] as [Token, BinaryOp]),
      );
      parseWs(ctx);
      const right = nextLevel(ctx);
      left = {
        type: "binary-op",
        op: op as BinaryOp,
        left,
        right,
      };
    } catch {
      break;
    }
  }

  return left;
}

export type UnaryOp = "not" | "NOT";

export type UnaryOpAST = {
  type: "unary-op";
  op: UnaryOp;
  operand: ExpressionAST;
};

export function parseUnaryExpr(ctx: ParseContext): ExpressionAST {
  try {
    parseWs(ctx);
    const op = parseLiteral(ctx, [Token.operator, "not"]);

    parseWs(ctx);
    const operand = parseExpression(ctx);
    return {
      type: "unary-op",
      op,
      operand,
    };
  } catch {
    return parseTerm(ctx);
  }
}

export function parseGroup(ctx: ParseContext): ExpressionAST {
  parseWs(ctx);
  parseLiteral(ctx, [Token.paren, "("]);
  parseWs(ctx);
  const expr = parseExpression(ctx);
  parseWs(ctx);
  parseLiteral(ctx, [Token.paren, ")"]);
  return expr;
}

export type FunctionCallAST = {
  type: "function-call";
  name: BuiltinFuncName;
  args: ExpressionAST[];
};

export function parseFunctionCall(ctx: ParseContext): ExpressionAST {
  parseWs(ctx);
  const fnName = parseLiteral(
    ctx,
    ...Object.keys(builtinFuncs).map(
      (name) => [Token.function, name] as [Token, BuiltinFuncName],
    ),
  );

  parseWs(ctx);
  parseLiteral(ctx, [Token.paren, "("]);
  parseWs(ctx);

  const args: ExpressionAST[] = [];
  while (true) {
    try {
      parseWs(ctx);
      args.push(parseExpression(ctx));
    } catch {
      break;
    }

    parseWs(ctx);
    const next = parseOptional(ctx, (c) => parseLiteral(c, [Token.comma, ","]));
    if (!next) break;
  }

  parseWs(ctx);
  parseLiteral(ctx, [Token.paren, ")"]);

  return {
    type: "function-call",
    name: fnName,
    args,
  };
}
