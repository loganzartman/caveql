import type { EvalCommandAST } from "../../parser";
import { compileExpression } from "../compileExpression";
import { asPath } from "../utils";

export function compileEvalCommand(command: EvalCommandAST): string {
  const exprs = command.bindings
    .map(([prop, expr]) => {
      const path = asPath(prop.value);
      if (path.length === 1) {
        return `${JSON.stringify(path[0])}: (${compileExpression(expr)})`;
      }
      throw new Error("complex eval target not implemented");
    })
    .join(",\n");
  return `
    function* evalCommand(records) {
      for (const record of records) {
        yield {
          ...record,
          ${exprs}
        };
      }
    }
  `;
}
