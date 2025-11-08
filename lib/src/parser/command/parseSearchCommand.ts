import { Token } from "../../tokens";
import type { ParseContext } from "../ParseContext";
import { parseLiteral, parseStar, parseWs } from "../parseCommon";
import {
  parseSearchExpression,
  type SearchExpressionAST,
} from "../parseSearchExpression";

export type SearchCommandAST = {
  type: "search";
  filters: SearchExpressionAST[];
};

export function parseSearchCommand(ctx: ParseContext): SearchCommandAST {
  parseLiteral(ctx, [Token.command, "search"]);
  parseWs(ctx);
  return parseBareSearch(ctx);
}

export function parseBareSearch(ctx: ParseContext): SearchCommandAST {
  const filters: SearchExpressionAST[] = [];

  parseStar(ctx, (ctx) => {
    parseWs(ctx);
    filters.push(parseSearchExpression(ctx));
  });

  return {
    type: "search",
    filters,
  };
}
