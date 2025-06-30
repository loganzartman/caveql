import { impossible } from "../impossible";
import type { AggregationTermAST } from "../parser";
import { compileExpression } from "./compileExpression";
import { must } from "./utils";

export function aggKey(agg: AggregationTermAST) {
  if (agg.field === undefined) {
    return JSON.stringify(agg.type);
  }
  return JSON.stringify(`${agg.type}(${agg.field.value})`);
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

export function compileAggregationCollect(agg: AggregationTermAST): string {
  const k = aggKey(agg);
  switch (agg.type) {
    case "avg": {
      const recordValue = compileExpression({
        type: "string",
        quoted: false,
        value: must(agg.field, "avg() aggregation requires a field name").value,
      });
      return `agg[${k}] += (${recordValue})`;
    }
    case "count":
      return `++agg[${k}]`;
    case "max": {
      const recordValue = compileExpression({
        type: "string",
        quoted: false,
        value: must(agg.field, "max() aggregation requires a field name").value,
      });
      return `
				agg[${k}] = agg[${k}] === undefined 
					? (${recordValue})
					: Math.max(agg[${k}], (${recordValue}))
			`;
    }
    case "min": {
      const recordValue = compileExpression({
        type: "string",
        quoted: false,
        value: must(agg.field, "max() aggregation requires a field name").value,
      });
      return `
				agg[${k}] = agg[${k}] === undefined 
					? (${recordValue})
					: Math.min(agg[${k}], (${recordValue}))
			`;
    }
    case "sum": {
      const recordValue = compileExpression({
        type: "string",
        quoted: false,
        value: must(agg.field, "avg() aggregation requires a field name").value,
      });
      return `agg[${k}] += (${recordValue})`;
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
): string | undefined {
  const k = aggKey(agg);
  switch (agg.type) {
    case "avg":
      return `agg[${k}] / n`;
    case "count":
    case "max":
    case "min":
    case "sum":
      return `agg[${k}]`;
    case "distinct":
    case "median":
    case "mode":
    case "perc":
      throw new Error("Aggregation not implemented");
    default:
      impossible(agg.type);
  }
}
