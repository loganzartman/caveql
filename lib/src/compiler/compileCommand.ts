import { impossible } from "../impossible";
import type { CommandAST } from "../parser/parseCommand";
import { compileEvalCommand } from "./command/compileEvalCommand";
import { compileFieldsCommand } from "./command/compileFieldsCommand";
import { compileHeadCommand } from "./command/compileHeadCommand";
import { compileMakeresultsCommand } from "./command/compileMakeresultsCommand";
import { compileRexCommand } from "./command/compileRexCommand";
import { compileSearchCommand } from "./command/compileSearchCommand";
import { compileSortCommand } from "./command/compileSortCommand";
import { compileStatsCommand } from "./command/compileStatsCommand";
import { compileStreamstatsCommand } from "./command/compileStreamstatsCommand";
import { compileWhereCommand } from "./command/compileWhereCommand";
import { createCompileContext } from "./context";
import { compileDistribute } from "./distributed/compileDistributed";

export function compileCommand(command: CommandAST): string {
  const context = createCompileContext();
  switch (command.type) {
    case "search":
      return compileSearchCommand(command);
    case "eval":
      return compileDistribute({
        context,
        compileThread: () => compileEvalCommand(command),
      });
    case "fields":
      return compileFieldsCommand(command);
    case "head":
      return compileHeadCommand(command);
    case "makeresults":
      return compileMakeresultsCommand(command);
    case "rex":
      return compileRexCommand(command);
    case "sort":
      return compileSortCommand(command);
    case "stats":
      return compileStatsCommand(command);
    case "streamstats":
      return compileStreamstatsCommand(command);
    case "where":
      return compileWhereCommand(command);
    default:
      impossible(command);
  }
}
