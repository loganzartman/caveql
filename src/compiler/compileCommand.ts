import { impossible } from "../impossible";
import type { CommandAST } from "../parser/parseCommand";
import { compileEvalCommand } from "./command/compileEvalCommand";
import { compileFieldsCommand } from "./command/compileFieldsCommand";
import { compileMakeresultsCommand } from "./command/compileMakeresultsCommand";
import { compileSearchCommand } from "./command/compileSearchCommand";
import { compileSortCommand } from "./command/compileSortCommand";
import { compileStatsCommand } from "./command/compileStatsCommand";
import { compileStreamstatsCommand } from "./command/compileStreamstatsCommand";
import { compileWhereCommand } from "./command/compileWhereCommand";

export function compileCommand(command: CommandAST): string {
  switch (command.type) {
    case "search":
      return compileSearchCommand(command);
    case "eval":
      return compileEvalCommand(command);
    case "fields":
      return compileFieldsCommand(command);
    case "makeresults":
      return compileMakeresultsCommand(command);
    case "where":
      return compileWhereCommand(command);
    case "sort":
      return compileSortCommand(command);
    case "stats":
      return compileStatsCommand(command);
    case "streamstats":
      return compileStreamstatsCommand(command);
    default:
      impossible(command);
  }
}
