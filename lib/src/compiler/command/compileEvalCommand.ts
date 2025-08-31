import type { EvalCommandAST } from "../../parser";
import { compileExpression } from "../compileExpression";
import { compilePathSet } from "../utils";

export function compileEvalCommand(command: EvalCommandAST): string {
  return `
    async function* evalCommand(records) {
      for await (const record of records) {
        const newRecord = structuredClone(record);
        ${command.bindings.map(([prop, expr]) => `${compilePathSet("newRecord", prop.value, compileExpression(expr))}`).join("\n")}
        yield newRecord;
      }
    }
  `;
}
