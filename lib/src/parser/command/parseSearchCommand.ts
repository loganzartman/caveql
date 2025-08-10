import { Token } from "../../tokens";
import type { ParseContext } from "../ParseContext";
import { parseLiteral, parseWs } from "../parseCommon";
import {
  parseSearchExpression,
  type SearchExpressionAST,
} from "../parseSearchExpression";

export type SearchCommandAST = {
  type: "search";
  filters: SearchExpressionAST[];
};

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
