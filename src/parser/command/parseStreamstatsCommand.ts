import { Token } from "../../tokens";
import type { ParseContext } from "../ParseContext";
import { parseLiteral, parseWs } from "../parseCommon";
import {
  type AggregationTermAST,
  parseAggregationTerm,
} from "./parseAggregationTerm";

export type StreamstatsCommandAST = {
  type: "streamstats";
  aggregations: AggregationTermAST[];
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
    } catch {
      break;
    }
  }
  return { type: "streamstats", aggregations: terms };
}
