import { impossible } from "../impossible";
import type { AggregationTermAST, FieldNameAST } from "../parser";
import { compileExpression } from "./compileExpression";
import { compilePathGet, must } from "./utils";

export function aggKey(agg: AggregationTermAST) {
  if (agg.field === undefined) {
    return JSON.stringify(agg.type);
  }
  return JSON.stringify(`${agg.type}(${agg.field.value})`);
}

export function compileAggregationGroupKeyFn(groupBy: FieldNameAST[]): string {
  return `((record) => JSON.stringify([${groupBy.map((g) => compilePathGet("record", g.value)).join(", ")}]))`;
}

export function compileAggregationInit(agg: AggregationTermAST): string {
  switch (agg.type) {
    case "avg":
    case "count":
    case "distinct":
    case "sum":
      return "0";
    case "max":
    case "min":
    case "median":
    case "mode":
    case "perc":
      return "undefined";
    default:
      impossible(agg.type);
  }
}

export function compileAggregationReduce(
  agg: AggregationTermAST,
  accumulator: string,
): string {
  switch (agg.type) {
    case "avg": {
      const recordValue = compileExpression(
        must(agg.field, "avg() aggregation requires a field name"),
      );
      return `${accumulator} += (${recordValue})`;
    }
    case "count":
      return `${accumulator} += 1`;
    case "max": {
      const recordValue = compileExpression(
        must(agg.field, "max() aggregation requires a field name"),
      );
      return `
        ${accumulator} = ${accumulator} === undefined 
          ? (${recordValue})
          : Math.max(${accumulator}, (${recordValue}))
      `;
    }
    case "min": {
      const recordValue = compileExpression(
        must(agg.field, "min() aggregation requires a field name"),
      );
      return `
        ${accumulator} = ${accumulator} === undefined 
          ? (${recordValue})
          : Math.min(${accumulator}, (${recordValue}))
      `;
    }
    case "sum": {
      const recordValue = compileExpression(
        must(agg.field, "sum() aggregation requires a field name"),
      );
      return `${accumulator} += (${recordValue})`;
    }
    case "distinct":
    case "median":
    case "mode":
    case "perc":
      throw new Error("Aggregation not implemented");
    default:
      impossible(agg.type);
  }
}

export function compileAggregationFinal(
  agg: AggregationTermAST,
  accumulator: string,
): string | undefined {
  switch (agg.type) {
    case "avg":
      return `${accumulator} / n`;
    case "count":
    case "max":
    case "min":
    case "sum":
      return `${accumulator}`;
    case "distinct":
    case "median":
    case "mode":
    case "perc":
      throw new Error("Aggregation not implemented");
    default:
      impossible(agg.type);
  }
}
