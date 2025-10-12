import { z } from "zod";
import {
  type EvalCommandAST,
  evalCommandASTSchema,
  parseEvalCommand,
} from "./command/parseEvalCommand";
import {
  type FieldsCommandAST,
  fieldsCommandASTSchema,
  parseFieldsCommand,
} from "./command/parseFieldsCommand";
import {
  type MakeresultsCommandAST,
  makeresultsCommandASTSchema,
  parseMakeresultsCommand,
} from "./command/parseMakeresultsCommand";
import {
  parseRexCommand,
  type RexCommandAST,
  rexCommandASTSchema,
} from "./command/parseRexCommand";
import {
  parseSearchCommand,
  type SearchCommandAST,
  searchCommandASTSchema,
} from "./command/parseSearchCommand";
import {
  parseSortCommand,
  type SortCommandAST,
  sortCommandASTSchema,
} from "./command/parseSortCommand";
import {
  parseStatsCommand,
  type StatsCommandAST,
  statsCommandASTSchema,
} from "./command/parseStatsCommand";
import {
  parseStreamstatsCommand,
  type StreamstatsCommandAST,
  streamstatsCommandASTSchema,
} from "./command/parseStreamstatsCommand";
import {
  parseWhereCommand,
  type WhereCommandAST,
  whereCommandASTSchema,
} from "./command/parseWhereCommand";
import type { ParseContext } from "./ParseContext";
import { parseOne } from "./parseCommon";

export const commandASTSchema = z.union([
  evalCommandASTSchema,
  fieldsCommandASTSchema,
  makeresultsCommandASTSchema,
  rexCommandASTSchema,
  searchCommandASTSchema,
  sortCommandASTSchema,
  statsCommandASTSchema,
  streamstatsCommandASTSchema,
  whereCommandASTSchema,
]);
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
