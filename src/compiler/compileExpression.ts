import { impossible } from "../impossible";
import type { ExpressionAST } from "../parser";

export function compileExpression(expr: ExpressionAST): string {
  switch (expr.type) {
    case "number":
      if (typeof expr.value === "bigint") {
        return `${expr.value}n`;
      }
      return `${expr.value}`;
    case "string":
      if (!expr.quoted) {
        const path = expr.value.split(".");
        return `record[${path.map((seg) => JSON.stringify(seg)).join("]?.[")}]`;
      }
      return JSON.stringify(expr.value);
    case "<":
    case "<=":
    case ">=":
    case ">":
      return `(${compileExpression(expr.left)} ${expr.type} ${compileExpression(expr.right)})`;
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
    case "not":
      return `(!${compileExpression(expr.operand)})`;
    case "NOT":
      throw new Error("Internal error: got 'NOT' in expression");
    case "%":
    case "+":
    case "-":
    case "*":
    case "/":
      return `(${compileExpression(expr.left)} ${expr.type} ${compileExpression(expr.right)})`;
    default:
      impossible(expr);
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
        const path = expr.value.split(".");
        return `record[${path.map((seg) => JSON.stringify(seg)).join("]?.[")}]`;
      }
      return JSON.stringify(expr.value);
    case "<":
    case "<=":
    case ">=":
    case ">":
      return `(${compileCompareExpression(expr.left, {
        lhs: true,
        comparison: true,
      })} ${expr.type} ${compileCompareExpression(expr.right, {
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
    case "NOT":
      return `(!${compileCompareExpression(expr.operand)})`;
    case "not":
      throw new Error("Internal error: got 'not' in compare expression");
    case "%":
    case "+":
    case "-":
    case "*":
    case "/":
      return `(${compileCompareExpression(expr.left, { lhs: true })} ${expr.type} ${compileCompareExpression(expr.right)})`;
    default:
      impossible(expr);
  }
}
