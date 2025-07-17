import {
  type EvalCommandAST,
  parseEvalCommand,
} from "./command/parseEvalCommand";
import {
  type FieldsCommandAST,
  parseFieldsCommand,
} from "./command/parseFieldsCommand";
import {
  type MakeresultsCommandAST,
  parseMakeresultsCommand,
} from "./command/parseMakeresultsCommand";
import { parseRexCommand, type RexCommandAST } from "./command/parseRexCommand";
import {
  parseSearchCommand,
  type SearchCommandAST,
} from "./command/parseSearchCommand";
import {
  parseSortCommand,
  type SortCommandAST,
} from "./command/parseSortCommand";
import {
  parseStatsCommand,
  type StatsCommandAST,
} from "./command/parseStatsCommand";
import {
  parseStreamstatsCommand,
  type StreamstatsCommandAST,
} from "./command/parseStreamstatsCommand";
import {
  parseWhereCommand,
  type WhereCommandAST,
} from "./command/parseWhereCommand";
import type { ParseContext } from "./ParseContext";
import { parseOne } from "./parseCommon";

export type CommandAST =
  | EvalCommandAST
  | FieldsCommandAST
  | MakeresultsCommandAST
  | RexCommandAST
  | SearchCommandAST
  | SortCommandAST
  | StatsCommandAST
  | StreamstatsCommandAST
  | WhereCommandAST;

export function parseCommand(ctx: ParseContext): CommandAST {
  return parseOne(
    ctx,
    parseEvalCommand,
    parseFieldsCommand,
    parseMakeresultsCommand,
    parseRexCommand,
    parseSearchCommand,
    parseSortCommand,
    parseStatsCommand,
    parseStreamstatsCommand,
    parseWhereCommand,
  );
}
