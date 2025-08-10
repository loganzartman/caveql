import { impossible } from "../impossible";
import type {
  BinaryOpAST,
  ExpressionAST,
  FunctionCallAST,
  UnaryOpAST,
} from "../parser";
import { compilePathGet } from "./utils";

export function compileExpression(expr: ExpressionAST): string {
  switch (expr.type) {
    case "number":
      if (typeof expr.value === "bigint") {
        return `${expr.value}n`;
      }
      return `${expr.value}`;
    case "field-name":
      return compilePathGet("record", expr.value);
    case "string":
      return JSON.stringify(expr.value);
    case "binary-op":
      return compileBinaryOp(expr);
    case "unary-op":
      return compileUnaryOp(expr);
    case "function-call":
      return compileFunctionCall(expr);
    default:
      impossible(expr);
  }
}

function compileBinaryOp(expr: BinaryOpAST): string {
  switch (expr.op) {
    case "<":
    case "<=":
    case ">=":
    case ">":
      return `(${compileExpression(expr.left)} ${expr.op} ${compileExpression(expr.right)})`;
    case "!=":
      return `(${compileExpression(expr.left)} !== ${compileExpression(expr.right)})`;
    case "==":
    case "=":
      return `(${compileExpression(expr.left)} === ${compileExpression(expr.right)})`;
    case "and":
      return `(${compileExpression(expr.left)} && ${compileExpression(expr.right)})`;
    case "AND":
      throw new Error("Internal error: got 'AND' in expression");
    case "or":
      return `(${compileExpression(expr.left)} || ${compileExpression(expr.right)})`;
    case "OR":
      throw new Error("Internal error: got 'OR' in expression");
    case "%":
      return `mod(${compileExpression(expr.left)}, ${compileExpression(expr.right)})`;
    case "+":
      return `add(${compileExpression(expr.left)}, ${compileExpression(expr.right)})`;
    case "-":
      return `sub(${compileExpression(expr.left)}, ${compileExpression(expr.right)})`;
    case "*":
      return `mul(${compileExpression(expr.left)}, ${compileExpression(expr.right)})`;
    case "/":
      return `div(${compileExpression(expr.left)}, ${compileExpression(expr.right)})`;
    case ".":
      return `concat(${compileExpression(expr.left)}, ${compileExpression(expr.right)})`;
    default:
      impossible(expr.op);
  }
}

function compileUnaryOp(expr: UnaryOpAST): string {
  switch (expr.op) {
    case "not":
      return `(!${compileExpression(expr.operand)})`;
    case "NOT":
      throw new Error("Internal error: got 'NOT' in expression");
    default:
      impossible(expr.op);
  }
}

function compileFunctionCall(expr: FunctionCallAST): string {
  return builtinFuncs[expr.name](expr.args);
}

export const builtinFuncs = {
  $lit: (args) => {
    if (args[0].type !== "string") {
      throw new Error("Invalid argument for $lit function");
    }
    return `(${args[0].value})`;
  },

  case: (args) => {
    if (args.length % 2 > 0) {
      throw new Error("Invalid number of arguments for 'case'");
    }

    const cases: string[] = [];

    for (let i = 0; i < args.length; i += 2) {
      const condition = compileExpression(args[i]);
      const value = compileExpression(args[i + 1]);
      cases.push(`if (${condition}) { return (${value}); }`);
    }

    return `(function caseFn(){
      ${cases.join("\n")}
    })()`;
  },

  coalesce: (args) => {
    const values = args.map((arg) => `(${compileExpression(arg)})`);
    return `(${values.join(" ?? ")})`;
  },

  false: () => `false`,

  if: (args) =>
    `${compileExpression(args[0])} ? ${compileExpression(args[1])} : ${compileExpression(args[2])}`,

  isnull: (args) => `((${compileExpression(args[0])}) == null)`,

  isnum: (args) => {
    const value = compileExpression(args[0]);
    return `(typeof (${value}) === 'bigint' || (typeof (${value}) === 'number' && Number.isFinite(${value})))`;
  },

  len: (args) => `String(${compileExpression(args[0])}).length`,

  match: (args) =>
    `new RegExp(${compileExpression(args[1])}, 'gu').test(${compileExpression(args[0])})`,

  null: () => `null`,

  random: () => `randomInt()`,

  replace: (args) =>
    `String(${compileExpression(args[0])}).replace(new RegExp(${compileExpression(args[1])}, 'gu'), ${compileExpression(args[2])})`,

  round: (args) => `Math.round(${compileExpression(args[0])})`,

  true: () => `true`,
} satisfies Record<string, (args: ExpressionAST[]) => string>;

export type BuiltinFuncName = keyof typeof builtinFuncs;
