import type { SearchCommandAST } from "../../parser";
import { compileCompareExpression } from "../compileExpression";

export function compileSearchCommand(command: SearchCommandAST): string {
  if (command.filters.length === 0) {
    return "function* searchCommand(records) { yield* records; }";
  }
  const conditions = command.filters
    .map((filter) => `(${compileCompareExpression(filter)})`)
    .join(" && ");
  return `
    function* searchCommand(records) {
      for (const record of records) {
        if (
          ${conditions}
        ) {
          yield record;
        }
      }
    }
  `;
}
