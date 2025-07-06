import { impossible } from "../impossible";
import type { CommandAST, ExpressionAST, QueryAST, StringAST } from "../parser";
import type { SearchExpressionAST } from "../parser/parseSearchExpression";

const lineLength = 80;
const indent = "  ";

export function printAST(
  ast: QueryAST | CommandAST | StringAST | ExpressionAST | SearchExpressionAST,
  depth = 0,
): string {
  switch (ast.type) {
    case "binary-op": {
      const oneLine = `(${printAST(ast.left, depth)} ${ast.op} ${printAST(ast.right, depth)})`;
      if (oneLine.length <= lineLength) {
        return oneLine;
      }
      return `(${printAST(ast.left, depth + 1)}\n${indent.repeat(depth + 1)}${ast.op} ${printAST(ast.right, depth + 1)})`;
    }
    case "compare":
      return `(${printAST(ast.left, depth)} ${ast.op} ${printAST(ast.right, depth)})`;
    case "eval": {
      const bindings = ast.bindings.map(
        ([name, value]) => `${printAST(name)} = ${printAST(value)}`,
      );
      const oneLine = bindings.join(", ");
      if (oneLine.length <= lineLength) {
        return `eval ${oneLine}`;
      }
      return `eval ${bindings.join(`,\n${indent}`)}`;
    }
    case "field-name":
      return ast.value;
    case "fields": {
      const fields = ast.fields.map((field) => printAST(field));
      const oneLine = fields.join(", ");
      if (oneLine.length <= lineLength) {
        return `fields ${oneLine}`;
      }
      return `fields\n${indent}${fields.join(`,\n${indent}`)}`;
    }
    case "makeresults": {
      if (ast.count) {
        return `makeresults count=${printAST(ast.count)}`;
      }
      return `makeresults format=${ast.format} data=${printAST(ast.data)}`;
    }
    case "number":
      return ast.value.toString();
    case "query":
      return ast.pipeline.map((command) => printAST(command)).join("\n| ");
    case "search": {
      const filters = ast.filters.map((filter) => printAST(filter, depth));
      const oneLine = filters.join(" ");
      if (oneLine.length <= lineLength) {
        return `search ${oneLine}`;
      }
      return `search\n${indent.repeat(depth + 1)}${filters.join(`\n${indent.repeat(depth + 1)}`)}`;
    }
    case "search-binary-op": {
      const oneLine = `(${printAST(ast.left, depth)} ${ast.op} ${printAST(ast.right, depth)})`;
      if (oneLine.length <= lineLength) {
        return oneLine;
      }
      return `(${printAST(ast.left, depth + 1)}\n${indent.repeat(depth + 1)}${ast.op} ${printAST(ast.right, depth + 1)})`;
    }
    case "search-unary-op": {
      const oneLine = `(${ast.op} ${printAST(ast.operand, depth)})`;
      if (oneLine.length <= lineLength) {
        return oneLine;
      }
      return `(${ast.op}\n${indent.repeat(depth + 1)}${printAST(ast.operand, depth + 1)})`;
    }
    case "sort": {
      const sortFields = ast.fields.map((field) => {
        const direction =
          field.desc !== undefined ? (field.desc ? "-" : "+") : "";
        if (field.comparator) {
          return `${direction}${field.comparator}(${printAST(field.field, depth)})`;
        }
        return `${direction}${printAST(field.field, depth)}`;
      });
      const oneLine = sortFields.join(", ");
      if (oneLine.length <= lineLength) {
        return `sort ${oneLine}`;
      }
      return `sort\n${indent.repeat(depth + 1)}${sortFields.join(`,\n${indent.repeat(depth + 1)}`)}`;
    }
    case "streamstats":
    case "stats": {
      const aggregations = ast.aggregations.map((agg) => {
        if (agg.field) {
          return `${agg.type}(${printAST(agg.field, depth)})`;
        }
        return agg.type;
      });
      return `${ast.type} ${aggregations.join(", ")}`;
    }
    case "string":
      return JSON.stringify(ast.value);
    case "where": {
      const expr = printAST(ast.expr, depth);
      return `where ${expr}`;
    }
    case "unary-op": {
      const operand = printAST(ast.operand, depth);
      const op = ast.op;
      const oneLine = `${op} ${operand}`;
      if (oneLine.length <= lineLength) {
        return oneLine;
      }
      return `${op}\n${indent.repeat(depth + 1)}${operand}`;
    }
    default:
      impossible(ast);
  }
}
