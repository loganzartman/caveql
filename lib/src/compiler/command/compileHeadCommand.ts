import type {
  HeadCommandAST,
  HeadCommandCountAST,
  HeadCommandExprAST,
} from "../../parser/command/parseHeadCommand";
import { compileExpression } from "../compileExpression";

export function compileHeadCommand(command: HeadCommandAST): string {
  if ("expr" in command) {
    return compileHeadExprCommand(command);
  }
  return compileHeadLimitCommand(command);
}

function compileHeadLimitCommand(command: HeadCommandCountAST): string {
  if (command.n !== undefined && command.limit !== undefined) {
    throw new Error("limit and n cannot be specified together");
  }

  const limit = (command.n ?? command.limit)?.value ?? 10;

  return `
    async function* headCommand(records) {
      let i = 0;
      for await (const record of records) {
        yield record;
        if (++i >= ${limit}) {
          break;
        }
      }
    }
  `;
}

function compileHeadExprCommand(command: HeadCommandExprAST): string {
  let exprCondition = compileExpression(command.expr);
  if (command.allowNull) {
    exprCondition = `!${exprCondition} && ${exprCondition} !== null`;
  } else {
    exprCondition = `!${exprCondition}`;
  }

  let limitInit = "";
  if (command.limit) {
    limitInit = `let i = 0;`;
  }

  let limitCheck = "";
  if (command.limit) {
    limitCheck = `
      if (i++ >= ${command.limit.value}) {
        break;
      }
    `;
  }

  return `
    async function* headCommand(records) {
      ${limitInit}
      for await (const record of records) {
        ${limitCheck}
        if (${exprCondition}) {
          ${command.keepLast ? "yield record;" : ""}
          break;
        }
        yield record;
      }
    }
  `;
}
