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

export type StatsCommandAST = {
  type: "stats";
  aggregations: AggregationTermAST[];
  groupBy: FieldNameAST[];
};

export function parseStatsCommand(ctx: ParseContext): StatsCommandAST {
  parseLiteral(ctx, [Token.command, "stats"]);

  const terms: AggregationTermAST[] = [];
  parseOptional(ctx, (ctx) => {
    parseWs(ctx);
    parsePlus(ctx, (ctx, { first }) => {
      if (!first) {
        // commas optional
        parseOne(
          ctx,
          (ctx) => {
            parseOptional(ctx, parseWs);
            parseLiteral(ctx, [Token.operator, ","]);
            parseOptional(ctx, parseWs);
          },
          parseWs,
        );
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

  return { type: "stats", aggregations: terms, groupBy };
}
