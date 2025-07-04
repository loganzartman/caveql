import { Token } from "../../tokens";
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
  parseLiteral(ctx, [Token.command, "eval"]);

  const bindings: [StringAST, ExpressionAST][] = [];
  while (true) {
    try {
      parseWs(ctx);
      const name = parseString(ctx, { isField: true });
      parseWs(ctx);
      parseLiteral(ctx, [Token.operator, "="]);
      parseWs(ctx);
      const expr = parseExpr(ctx);
      bindings.push([name, expr]);

      parseWs(ctx);
      parseLiteral(ctx, [Token.comma, ","]);
    } catch {
      break;
    }
  }

  return { type: "eval", bindings };
}
