import { z } from "zod";
import { Token } from "../../tokens";
import type { ParseContext } from "../ParseContext";
import { parseLiteral, parseWs } from "../parseCommon";
import {
  parseSearchExpression,
  type SearchExpressionAST,
  searchExpressionASTSchema,
} from "../parseSearchExpression";

export const searchCommandASTSchema = z.object({
  type: z.literal("search"),
  filters: z.array(searchExpressionASTSchema),
});
export type SearchCommandAST = z.infer<typeof searchCommandASTSchema>;

export function parseSearchCommand(ctx: ParseContext): SearchCommandAST {
  parseWs(ctx);
  parseLiteral(ctx, [Token.command, "search"]);
  parseWs(ctx);
  return parseBareSearch(ctx);
}

export function parseBareSearch(ctx: ParseContext): SearchCommandAST {
  const filters: SearchExpressionAST[] = [];
  while (true) {
    try {
      parseWs(ctx);
      const filter = parseSearchExpression(ctx);
      filters.push(filter);
    } catch {
      break;
    }
  }
  return {
    type: "search",
    filters,
  };
}
