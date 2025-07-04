import { Token } from "../tokens";
import { parseBareSearch } from "./command/parseSearchCommand";
import { type CommandAST, parseCommand } from "./parseCommand";
import { parseLiteral, parseOne, parseWs } from "./parseCommon";
import type { ParseContext } from "./types";

export function parsePipeline(ctx: ParseContext): CommandAST[] {
  const commands: CommandAST[] = [];
  let first = true;
  while (true) {
    try {
      parseWs(ctx);
      // allow bare search without the search keyword
      const command = first
        ? parseOne(ctx, parseCommand, parseBareSearch)
        : parseCommand(ctx);
      commands.push(command);
      parseWs(ctx);
      parseLiteral(ctx, [Token.pipe, "|"]);
    } catch {
      break;
    }
    first = false;
  }
  return commands;
}
