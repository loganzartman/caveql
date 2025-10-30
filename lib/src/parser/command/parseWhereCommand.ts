import { Token } from "../../tokens";
import type { ParseContext } from "../ParseContext";
import { parseLiteral, parseWs } from "../parseCommon";
import type { ExpressionAST } from "../parseExpression";
import { parseExpression } from "../parseExpression";

export type WhereCommandAST = {
  type: "where";
  expr: ExpressionAST;
};

export function parseWhereCommand(ctx: ParseContext): WhereCommandAST {
  parseWs(ctx);
  parseLiteral(ctx, [Token.command, "where"]);
  parseWs(ctx);
  const expr = parseExpression(ctx);
  return { type: "where", expr };
}
