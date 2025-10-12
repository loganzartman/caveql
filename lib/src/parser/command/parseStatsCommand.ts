import { z } from "zod";
import { Token } from "../../tokens";
import type { ParseContext } from "../ParseContext";
import { parseLiteral, parseWs } from "../parseCommon";
import {
  type AggregationTermAST,
  aggregationTermASTSchema,
  parseAggregationTerm,
} from "./parseAggregationTerm";

export const statsCommandASTSchema = z.object({
  type: z.literal("stats"),
  aggregations: z.array(aggregationTermASTSchema),
});
export type StatsCommandAST = z.infer<typeof statsCommandASTSchema>;

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
