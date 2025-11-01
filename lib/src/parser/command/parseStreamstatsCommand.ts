import { Token } from "../../tokens";
import type { ParseContext } from "../ParseContext";
import {
  type FieldNameAST,
  parseFieldName,
  parseLiteral,
  parseOptional,
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
  parseWs(ctx);
  parseLiteral(ctx, [Token.command, "streamstats"]);

  const terms: AggregationTermAST[] = [];
  while (true) {
    try {
      parseWs(ctx);
      const term = parseAggregationTerm(ctx);
      terms.push(term);

      // commas optional
      try {
        parseWs(ctx);
        parseLiteral(ctx, [Token.operator, ","]);
      } catch {}
    } catch {
      break;
    }
  }

  const groupBy: FieldNameAST[] = [];
  parseOptional(ctx, (ctx) => {
    parseWs(ctx);
    parseLiteral(ctx, [Token.keyword, "by"]);
    while (true) {
      try {
        parseWs(ctx);
        groupBy.push(parseFieldName(ctx));
        parseOptional(ctx, (c) => parseLiteral(c, [Token.comma, ","]));
      } catch {
        break;
      }
    }
  });

  return { type: "streamstats", aggregations: terms, groupBy };
}
