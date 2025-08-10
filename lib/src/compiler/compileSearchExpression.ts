import { impossible } from "../impossible";
import type {
  CompareExpressionAST,
  SearchBinaryExpressionAST,
  SearchExpressionAST,
  SearchUnaryExpressionAST,
} from "../parser/parseSearchExpression";
import { compileExpression } from "./compileExpression";
import { compilePathGet } from "./utils";

export function compileSearchExpression(expr: SearchExpressionAST): string {
  switch (expr.type) {
    case "string":
      return `
        Object.entries(record)
          .flat()
          .some((v) => looseEq(v, ${JSON.stringify(expr.value)}))
      `;
    case "number":
      return `
        Object.entries(record)
          .flat()
          .some((v) => v == ${expr.value})
      `;
    case "search-binary-op":
      return compileSearchBinaryOp(expr);
    case "search-unary-op":
      return compileSearchUnaryOp(expr);
    case "compare":
      return compileCompareExpression(expr);
    default:
      impossible(expr);
  }
}

function compileSearchBinaryOp(expr: SearchBinaryExpressionAST): string {
  switch (expr.op) {
    case "AND":
      return `(${compileSearchExpression(expr.left)} && ${compileSearchExpression(expr.right)})`;
    case "OR":
      return `(${compileSearchExpression(expr.left)} || ${compileSearchExpression(expr.right)})`;
    default:
      impossible(expr.op);
  }
}

function compileSearchUnaryOp(expr: SearchUnaryExpressionAST): string {
  switch (expr.op) {
    case "NOT":
      return `(!${compileSearchExpression(expr.operand)})`;
    default:
      impossible(expr.op);
  }
}

function compileCompareExpression(expr: CompareExpressionAST): string {
  switch (expr.op) {
    case "=":
      return `looseEq(${compilePathGet("record", expr.left.value)}, ${compileExpression(expr.right)})`;
    case "!=":
      return `(!looseEq(${compilePathGet("record", expr.left.value)}, ${compileExpression(expr.right)}))`;
    case "<":
    case "<=":
    case ">":
    case ">=":
      return `(${compilePathGet("record", expr.left.value)} ${expr.op} ${compileExpression(expr.right)})`;
    default:
      impossible(expr.op);
  }
}
