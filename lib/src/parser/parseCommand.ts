import { z } from "zod";
import {
  evalCommandASTSchema,
  parseEvalCommand,
} from "./command/parseEvalCommand";
import {
  fieldsCommandASTSchema,
  parseFieldsCommand,
} from "./command/parseFieldsCommand";
import {
  makeresultsCommandASTSchema,
  parseMakeresultsCommand,
} from "./command/parseMakeresultsCommand";
import {
  parseRexCommand,
  rexCommandASTSchema,
} from "./command/parseRexCommand";
import {
  parseSearchCommand,
  searchCommandASTSchema,
} from "./command/parseSearchCommand";
import {
  parseSortCommand,
  sortCommandASTSchema,
} from "./command/parseSortCommand";
import {
  parseStatsCommand,
  statsCommandASTSchema,
} from "./command/parseStatsCommand";
import {
  parseStreamstatsCommand,
  streamstatsCommandASTSchema,
} from "./command/parseStreamstatsCommand";
import {
  parseWhereCommand,
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
export type CommandAST = z.infer<typeof commandASTSchema>;

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
