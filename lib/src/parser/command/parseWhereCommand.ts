import { z } from "zod";
import { Token } from "../../tokens";
import type { ParseContext } from "../ParseContext";
import { parseLiteral, parseWs } from "../parseCommon";
import { expressionASTSchema, parseExpression } from "../parseExpression";

export const whereCommandASTSchema = z.object({
  type: z.literal("where"),
  expr: expressionASTSchema,
});
export type WhereCommandAST = z.infer<typeof whereCommandASTSchema>;

export function parseWhereCommand(ctx: ParseContext): WhereCommandAST {
  parseWs(ctx);
  parseLiteral(ctx, [Token.command, "where"]);
  parseWs(ctx);
  const expr = parseExpression(ctx);
  return { type: "where", expr };
}
