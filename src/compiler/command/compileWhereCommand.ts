import type { WhereCommandAST } from "../../parser";
import { compileExpression } from "../compileExpression";

export function compileWhereCommand(command: WhereCommandAST): string {
  return `
    function* (records) {
		  for (const record of records) {
			  if (
				  ${compileExpression(command.expr)}
				) {
				  yield record;
				}
			}
		}
	`;
}
