import type { SearchCommandAST } from "../../parser";
import { compileSearchExpression } from "../compileSearchExpression";

export function compileSearchCommand(command: SearchCommandAST): string {
  if (command.filters.length === 0) {
    return "async function* searchCommand(records) { yield* records; }";
  }
  const conditions = command.filters
    .map((filter) => `(${compileSearchExpression(filter)})`)
    .join(" && ");
  return `
    async function* searchCommand(records) {
      for await (const record of records) {
        if (
          ${conditions}
        ) {
          yield record;
        }
      }
    }
  `;
}
