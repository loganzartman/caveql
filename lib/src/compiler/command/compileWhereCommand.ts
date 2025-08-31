import type { WhereCommandAST } from "../../parser";
import { compileExpression } from "../compileExpression";

export function compileWhereCommand(command: WhereCommandAST): string {
  return `
    async function* whereCommand(records) {
      for await (const record of records) {
        if (
          ${compileExpression(command.expr)}
        ) {
          yield record;
        }
      }
    }
  `;
}
