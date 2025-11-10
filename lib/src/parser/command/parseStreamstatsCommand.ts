import { Token } from "../../tokens";
import type { ParseContext } from "../ParseContext";
import {
  type FieldNameAST,
  parseFieldName,
  parseLiteral,
  parseOne,
  parseOptional,
  parsePlus,
  parseWs,
} from "../parseCommon";
import {
  type AggregationTermAST,
  parseAggregationTerm,
} from "./parseAggregationTerm";

export type StreamstatsCommandAST = {
  type: "streamstats";
  aggregations: AggregationTermAST[];
  groupBy: FieldNameAST[];
};

export function parseStreamstatsCommand(
  ctx: ParseContext,
): StreamstatsCommandAST {
  parseLiteral(ctx, [Token.command, "streamstats"]);

  const terms: AggregationTermAST[] = [];
  parseOptional(ctx, (ctx) => {
    parseWs(ctx);
    parsePlus(ctx, (ctx, { first }) => {
      if (!first) {
        parseOne(ctx, (ctx) => {
          parseOptional(ctx, parseWs);
          parseLiteral(ctx, [Token.operator, ","]);
          parseOptional(ctx, parseWs);
        });
      }
      const term = parseAggregationTerm(ctx);
      terms.push(term);
    });
  });

  const groupBy: FieldNameAST[] = [];
  parseOptional(ctx, (ctx) => {
    parseWs(ctx);
    parseLiteral(ctx, [Token.keyword, "by"]);
    parsePlus(ctx, (ctx) => {
      parseWs(ctx);
      groupBy.push(parseFieldName(ctx));
      parseOptional(ctx, (c) => parseLiteral(c, [Token.comma, ","]));
    });
  });

  return { type: "streamstats", aggregations: terms, groupBy };
}
