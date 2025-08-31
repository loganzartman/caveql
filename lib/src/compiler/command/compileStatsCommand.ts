import type { StatsCommandAST } from "../../parser";
import {
  aggKey,
  compileAggregationCollect,
  compileAggregationFinal,
  compileAggregationInit,
} from "../compileAggregation";

export function compileStatsCommand(command: StatsCommandAST): string {
  return `
    async function* statsCommand(records) {
      const agg = {
        ${command.aggregations.map((agg) => `${aggKey(agg)}: ${compileAggregationInit(agg)}`).join(",\n")}
      };

      let n = 0;
      for await (const record of records) {
        ++n;
        ${command.aggregations.map(compileAggregationCollect).join(";\n")};
      };

      yield {
        ${command.aggregations
          .map((agg) => [
            agg.asField ? JSON.stringify(agg.asField.value) : aggKey(agg),
            compileAggregationFinal(agg),
          ])
          .filter(([, final]) => Boolean(final))
          .map(([name, final]) => `${name}: ${final}`)
          .join(",\n")}
      }
    }
  `;
}
