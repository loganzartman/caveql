import { Token } from "../../tokens";
import type { ParseContext } from "../ParseContext";
import { parseLiteral, parseWs } from "../parseCommon";
import {
  type AggregationTermAST,
  parseAggregationTerm,
} from "./parseAggregationTerm";

export type StatsCommandAST = {
  type: "stats";
  aggregations: AggregationTermAST[];
};

export function parseStatsCommand(ctx: ParseContext): StatsCommandAST {
  parseWs(ctx);
  parseLiteral(ctx, [Token.command, "stats"]);

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
  return { type: "stats", aggregations: terms };
}
