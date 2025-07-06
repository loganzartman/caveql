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
    case "string":
      if (!expr.quoted) {
        return compilePathGet("record", expr.value);
      }
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

export function compileCompareExpression(
  expr: ExpressionAST,
  {
    lhs = false,
    comparison = false,
  }: { lhs?: boolean; comparison?: boolean } = {},
): string {
  switch (expr.type) {
    case "number":
      if (!comparison) {
        return `
          Object.entries(record)
            .flat()
            .some((v) => v == ${expr.value})
        `;
      }
      if (lhs) {
        throw new Error(
          `Don't use number ${expr.value} on the left-hand side. Consider reversing the comparison.`,
        );
      }
      if (typeof expr.value === "bigint") {
        return `${expr.value}n`;
      }
      return `${expr.value}`;
    case "string":
      if (!comparison) {
        return `
          Object.entries(record)
            .flat()
            .some((v) => looseEq(v, ${JSON.stringify(expr.value)}))
        `;
      }
      if (lhs || !expr.quoted) {
        return compilePathGet("record", expr.value);
      }
      return JSON.stringify(expr.value);
    case "binary-op":
      return compileCompareBinaryOp(expr);
    case "unary-op":
      return compileCompareUnaryOp(expr);
    default:
      impossible(expr);
  }
}

function compileCompareBinaryOp(expr: BinaryOpAST): string {
  switch (expr.op) {
    case "<":
    case "<=":
    case ">=":
    case ">":
      return `(${compileCompareExpression(expr.left, {
        lhs: true,
        comparison: true,
      })} ${expr.op} ${compileCompareExpression(expr.right, {
        comparison: true,
      })})`;
    case "!=":
      return `(!looseEq(${compileCompareExpression(expr.left, {
        lhs: true,
        comparison: true,
      })}, ${compileCompareExpression(expr.right, {
        comparison: true,
      })}))`;
    case "==":
      throw new Error(
        `Don't use '==' in comparison expressions. Use '=' instead.`,
      );
    case "=":
      return `(looseEq(${compileCompareExpression(expr.left, {
        lhs: true,
        comparison: true,
      })}, ${compileCompareExpression(expr.right, {
        comparison: true,
      })}))`;
    case "AND":
      return `(${compileCompareExpression(expr.left, {
        lhs: true,
      })} && ${compileCompareExpression(expr.right)})`;
    case "and":
      throw new Error("Internal error: got 'and' in compare expression");
    case "OR":
      return `(${compileCompareExpression(expr.left, {
        lhs: true,
      })} || ${compileCompareExpression(expr.right)})`;
    case "or":
      throw new Error("Internal error: got 'or' in compare expression");
    case "%":
    case "+":
    case "-":
    case "*":
    case "/":
      return `(${compileCompareExpression(expr.left, { lhs: true })} ${expr.op} ${compileCompareExpression(expr.right)})`;
    default:
      impossible(expr.op);
  }
}

function compileCompareUnaryOp(expr: UnaryOpAST): string {
  switch (expr.op) {
    case "NOT":
      return `(!${compileCompareExpression(expr.operand)})`;
    case "not":
      throw new Error("Internal error: got 'not' in compare expression");
    default:
      impossible(expr.op);
  }
}
