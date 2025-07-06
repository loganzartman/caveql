import { impossible } from "../impossible";
import type { BinaryOpAST, ExpressionAST, UnaryOpAST } from "../parser";
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
    case "+":
    case "-":
    case "*":
    case "/":
      return `(${compileExpression(expr.left)} ${expr.op} ${compileExpression(expr.right)})`;
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
