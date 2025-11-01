import type { StreamstatsCommandAST } from "../../parser";
import {
  aggKey,
  compileAggregationFinal,
  compileAggregationGroupKeyFn,
  compileAggregationInit,
  compileAggregationReduce,
} from "../compileAggregation";

export function compileStreamstatsCommand(
  command: StreamstatsCommandAST,
): string {
  if (command.groupBy.length > 0) {
    return compileStreamstatsCommandGrouped(command);
  }
  return compileStreamstatsCommandUngrouped(command);
}

export function compileStreamstatsCommandGrouped(
  command: StreamstatsCommandAST,
): string {
  return `
    async function* streamstatsCommand(records) {
      const getGroupKey = ${compileAggregationGroupKeyFn(command.groupBy)};
      const acc = {};
      const count = {};

      for await (const record of records) {
        const groupKey = getGroupKey(record);
        count[groupKey] ??= 0;
        const n = ++count[groupKey];

        acc[groupKey] ??= {
          ${command.aggregations.map((agg) => `${aggKey(agg)}: ${compileAggregationInit(agg)}`).join(",\n")}
        };
        ${command.aggregations
          .map(
            (agg) =>
              `${compileAggregationReduce(agg, `acc[groupKey][${aggKey(agg)}]`)};`,
          )
          .join("\n")}

        yield {
          ...record,
          ${command.aggregations
            .map((agg) => [
              agg.asField ? JSON.stringify(agg.asField.value) : aggKey(agg),
              compileAggregationFinal(agg, `acc[groupKey][${aggKey(agg)}]`),
            ])
            .filter(([, final]) => Boolean(final))
            .map(([name, final]) => `${name}: ${final}`)
            .join(",\n")}
        };
      };
    }
  `;
}

export function compileStreamstatsCommandUngrouped(
  command: StreamstatsCommandAST,
): string {
  return `
    async function* statsCommand(records) {
      const acc = {
        ${command.aggregations.map((agg) => `${aggKey(agg)}: ${compileAggregationInit(agg)}`).join(",\n")}
      };

      let n = 0;
      for await (const record of records) {
        ++n;
        
        ${command.aggregations
          .map(
            (agg) => `${compileAggregationReduce(agg, `acc[${aggKey(agg)}]`)};`,
          )
          .join("\n")}
          
        yield {
          ...record,
          ${command.aggregations
            .map((agg) => [
              agg.asField ? JSON.stringify(agg.asField.value) : aggKey(agg),
              compileAggregationFinal(agg, `acc[${aggKey(agg)}]`),
            ])
            .filter(([, final]) => Boolean(final))
            .map(([name, final]) => `${name}: ${final}`)
            .join(",\n")}
        };
      }
    }
  `;
}
