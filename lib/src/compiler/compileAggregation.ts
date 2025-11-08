import { impossible } from "../impossible";
import type { AggregationTermAST, FieldNameAST } from "../parser";
import { compileExpression } from "./compileExpression";
import { compilePathGet, must } from "./utils";

export function aggKey(agg: AggregationTermAST) {
  let type: string = agg.type;
  if (agg.type === "perc" || agg.type === "exactperc") {
    type = `${type}${agg.percentile}`;
  }

  if (agg.field === undefined) {
    return JSON.stringify(type);
  }
  return JSON.stringify(`${type}(${agg.field.value})`);
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
      return "undefined";
    case "range":
      return "[null, null]";
    case "var":
    case "stdev":
      return "new StreamingVar()";
    case "mode":
      return "new StreamingMode()";
    case "median":
    case "perc":
      return "new StreamingPerc()";
    case "exactperc":
      return "new StreamingPerc({ exact: true })";
    default:
      impossible(agg);
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
      return `${accumulator} = max(${recordValue}, ${accumulator})`;
    }
    case "min": {
      const recordValue = compileExpression(
        must(agg.field, "min() aggregation requires a field name"),
      );
      return `${accumulator} = min(${recordValue}, ${accumulator})`;
    }
    case "range": {
      const recordValue = compileExpression(
        must(agg.field, "range() aggregation requires a field name"),
      );
      return `
        ${accumulator}[0] = min(${recordValue}, ${accumulator}[0]);
        ${accumulator}[1] = max(${recordValue}, ${accumulator}[1]);
      `;
    }
    case "var":
    case "stdev": {
      const recordValue = compileExpression(
        must(agg.field, `${agg.type}() aggregation requires a field name`),
      );
      return `${accumulator}.add(${recordValue})`;
    }
    case "sum": {
      const recordValue = compileExpression(
        must(agg.field, "sum() aggregation requires a field name"),
      );
      return `${accumulator} += (${recordValue})`;
    }
    case "mode": {
      const recordValue = compileExpression(
        must(agg.field, "mode() aggregation requires a field name"),
      );
      return `${accumulator}.add(${recordValue})`;
    }
    case "median":
    case "perc":
    case "exactperc": {
      const recordValue = compileExpression(
        must(agg.field, `${agg.type}() aggregation requires a field name`),
      );
      return `${accumulator}.add(${recordValue})`;
    }
    case "distinct":
      throw new Error("Aggregation not implemented");
    default:
      impossible(agg);
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
      return `${accumulator}`;
    case "range":
      return `${accumulator}[0] !== null ? (${accumulator}[1] - ${accumulator}[0]) : null`;
    case "var":
      return `${accumulator}.getVariance()`;
    case "stdev":
      return `${accumulator}.getStdev()`;
    case "sum":
      return `${accumulator}`;
    case "mode":
      return `${accumulator}.getMode()`;
    case "median":
      return `${accumulator}.getPercentile(50)`;
    case "perc":
    case "exactperc":
      return `${accumulator}.getPercentile(${agg.percentile})`;
    case "distinct":
      throw new Error("Aggregation not implemented");
    default:
      impossible(agg);
  }
}
