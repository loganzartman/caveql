import { Token } from "../../tokens";
import type { ParseContext } from "../ParseContext";
import {
  type FieldNameAST,
  parseFieldName,
  parseLiteral,
  parseOptional,
  parseWs,
} from "../parseCommon";
import { type ExpressionAST, parseExpression } from "../parseExpression";

export type EvalCommandAST = {
  type: "eval";
  bindings: [FieldNameAST, ExpressionAST][];
};

export function parseEvalCommand(ctx: ParseContext): EvalCommandAST {
  parseLiteral(ctx, [Token.command, "eval"]);

  const bindings: [FieldNameAST, ExpressionAST][] = [];
  parseOptional(ctx, (ctx) => {
    parseWs(ctx);

    while (true) {
      try {
        const name = parseFieldName(ctx);
        parseOptional(ctx, parseWs);
        parseLiteral(ctx, [Token.operator, "="]);
        parseOptional(ctx, parseWs);
        const expr = parseExpression(ctx);
        bindings.push([name, expr]);

        parseOptional(ctx, parseWs);
        parseLiteral(ctx, [Token.comma, ","]);
        parseOptional(ctx, parseWs);
      } catch {
        break;
      }
    }
  });

  return { type: "eval", bindings };
}
