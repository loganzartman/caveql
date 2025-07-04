import { Token } from "../../tokens";
import { parseLiteral, parseWs } from "../parseCommon";
import type { ParseContext } from "../types";
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
    } catch {
      break;
    }
  }
  return { type: "stats", aggregations: terms };
}
