import {
  type EvalCommandAST,
  parseEvalCommand,
} from "./command/parseEvalCommand";
import { parseMakeresultsCommand } from "./command/parseMakeresultsCommand";
import {
  parseSearchCommand,
  type SearchCommandAST,
} from "./command/parseSearchCommand";
import {
  parseStatsCommand,
  type StatsCommandAST,
} from "./command/parseStatsCommand";
import {
  parseStreamstatsCommand,
  type StreamstatsCommandAST,
} from "./command/parseStreamstatsCommand";
import {
  type MakeresultsCommandAST,
  parseWhereCommand,
  type WhereCommandAST,
} from "./command/parseWhereCommand";
import { parseOne } from "./parseCommon";
import type { ParseContext } from "./types";

export type CommandAST =
  | EvalCommandAST
  | MakeresultsCommandAST
  | SearchCommandAST
  | StatsCommandAST
  | StreamstatsCommandAST
  | WhereCommandAST;

export function parseCommand(ctx: ParseContext): CommandAST {
  return parseOne(
    ctx,
    parseEvalCommand,
    parseMakeresultsCommand,
    parseSearchCommand,
    parseStatsCommand,
    parseStreamstatsCommand,
    parseWhereCommand,
  );
}
