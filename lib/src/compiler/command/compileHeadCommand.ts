import type {
  HeadCommandAST,
  HeadCommandExprAST,
  HeadCommandLimitAST,
} from "../../parser/command/parseHeadCommand";
import { compileExpression } from "../compileExpression";

export function compileHeadCommand(command: HeadCommandAST): string {
  if ("expr" in command) {
    return compileHeadExprCommand(command);
  }
  return compileHeadLimitCommand(command);
}

function compileHeadLimitCommand(command: HeadCommandLimitAST): string {
  return `
    async function* headCommand(records) {
      let i = 0;
      for await (const record of records) {
        yield record;
        if (++i >= ${command.limit.value}) {
          break;
        }
      }
    }
  `;
}

function compileHeadExprCommand(command: HeadCommandExprAST): string {
  const condition = (() => {
    const expr = compileExpression(command.expr);
    if (command.allowNull) {
      return `!${expr} && ${expr} !== null`;
    }
    return `!${expr}`;
  })();

  return `
    async function* headCommand(records) {
      for await (const record of records) {
        if (${condition}) {
          ${command.keepLast ? "yield record;" : ""}
          break;
        }
        yield record;
      }
    }
  `;
}
