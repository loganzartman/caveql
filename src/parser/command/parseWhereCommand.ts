import { Token } from "../../tokens";
import type { ParseContext } from "../ParseContext";
import { parseLiteral, parseWs } from "../parseCommon";
import { type ExpressionAST, parseExpr } from "../parseExpr";

export type WhereCommandAST = {
  type: "where";
  expr: ExpressionAST;
};

export function parseWhereCommand(ctx: ParseContext): WhereCommandAST {
  parseWs(ctx);
  parseLiteral(ctx, [Token.command, "where"]);
  parseWs(ctx);
  const expr = parseExpr(ctx);
  return { type: "where", expr };
}
