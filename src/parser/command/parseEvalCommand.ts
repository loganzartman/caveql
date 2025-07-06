import { Token } from "../../tokens";
import type { ParseContext } from "../ParseContext";
import {
  type FieldNameAST,
  parseFieldName,
  parseLiteral,
  parseWs,
} from "../parseCommon";
import { type ExpressionAST, parseExpression } from "../parseExpression";

export type EvalCommandAST = {
  type: "eval";
  bindings: [FieldNameAST, ExpressionAST][];
};

export function parseEvalCommand(ctx: ParseContext): EvalCommandAST {
  parseWs(ctx);
  parseLiteral(ctx, [Token.command, "eval"]);

  const bindings: [FieldNameAST, ExpressionAST][] = [];
  while (true) {
    try {
      parseWs(ctx);
      const name = parseFieldName(ctx);
      parseWs(ctx);
      parseLiteral(ctx, [Token.operator, "="]);
      parseWs(ctx);
      const expr = parseExpression(ctx);
      bindings.push([name, expr]);

      parseWs(ctx);
      parseLiteral(ctx, [Token.comma, ","]);
    } catch {
      break;
    }
  }

  return { type: "eval", bindings };
}
