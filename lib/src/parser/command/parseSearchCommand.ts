import { Token } from "../../tokens";
import type { ParseContext } from "../ParseContext";
import { parseLiteral, parseOne, parseStar, parseWs } from "../parseCommon";
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
  return parseOne(
    ctx,
    (ctx) => {
      parseWs(ctx);
      return parseBareSearch(ctx);
    },
    () =>
      ({
        type: "search",
        filters: [],
      }) satisfies SearchCommandAST,
  );
}

export function parseBareSearch(ctx: ParseContext): SearchCommandAST {
  const filters = parseStar(ctx, (ctx, { first }) => {
    if (!first) {
      parseWs(ctx);
    }
    return parseSearchExpression(ctx);
  });

  return {
    type: "search",
    filters,
  };
}
