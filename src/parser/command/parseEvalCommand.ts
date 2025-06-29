import {
  parseLiteral,
  parseString,
  parseWs,
  type StringAST,
} from "../parseCommon";
import { type ExpressionAST, parseExpr } from "../parseExpr";
import type { ParseContext } from "../types";

export type EvalCommandAST = {
  type: "eval";
  bindings: [StringAST, ExpressionAST][];
};

export function parseEvalCommand(ctx: ParseContext): EvalCommandAST {
  parseWs(ctx);
  parseLiteral(ctx, "eval");

  const bindings: [StringAST, ExpressionAST][] = [];
  while (true) {
    try {
      parseWs(ctx);
      const name = parseString(ctx);
      parseWs(ctx);
      parseLiteral(ctx, "=");
      parseWs(ctx);
      const expr = parseExpr(ctx);
      bindings.push([name, expr]);

      parseWs(ctx);
      parseLiteral(ctx, ",");
    } catch {
      break;
    }
  }

  return { type: "eval", bindings };
}
