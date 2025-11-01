import type { StatsCommandAST } from "../../parser";
import {
  aggKey,
  compileAggregationFinal,
  compileAggregationGroupKeyFn,
  compileAggregationInit,
  compileAggregationReduce,
} from "../compileAggregation";
import { compilePathGet } from "../utils";

export function compileStatsCommand(command: StatsCommandAST): string {
  if (command.groupBy.length > 0) {
    return compileStatsCommandGrouped(command);
  }
  return compileStatsCommandUngrouped(command);
}

export function compileStatsCommandGrouped(command: StatsCommandAST): string {
  return `
    async function* statsCommand(records) {
      const getGroupKey = ${compileAggregationGroupKeyFn(command.groupBy)};
      const getGroupEntries = (record) => ({
        ${command.groupBy
          .map(
            (group) =>
              `${JSON.stringify(group.value)}: ${compilePathGet("record", group.value)}`,
          )
          .join(",\n")}
      });

      const groupEntries = {};
      const acc = {};
      const count = {};

      for await (const record of records) {
        const groupKey = getGroupKey(record);
        groupEntries[groupKey] ??= getGroupEntries(record);
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
      };
      
      for (const groupKey in acc) {
        const n = count[groupKey];
        yield {
          ...groupEntries[groupKey],
          ${command.aggregations
            .map((agg) => [
              agg.asField ? JSON.stringify(agg.asField.value) : aggKey(agg),
              compileAggregationFinal(agg, `acc[groupKey][${aggKey(agg)}]`),
            ])
            .filter(([, final]) => Boolean(final))
            .map(([name, final]) => `${name}: ${final}`)
            .join(",\n")}
        };
      }
    }
  `;
}

export function compileStatsCommandUngrouped(command: StatsCommandAST): string {
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
      }
      
      yield {
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
  `;
}
