import type { StatsCommandAST } from "../../parser";
import { compileAggregationInit, compileAggregationCollect, compileAggregationFinal, aggKey } from "../compileAggregation";

export function compileStatsCommand(command: StatsCommandAST): string {
  return `
		function* (records) {
			const agg = {
				${command.aggregations.map((agg) => `${aggKey(agg)}: ${compileAggregationInit(agg)}`).join(",\n")}
			};

			let n = 0;
			for (const record of records) {
				++n;
				${command.aggregations.map(compileAggregationCollect).join(";\n")};
			};

			yield {
				${command.aggregations
          .map((agg) => [aggKey(agg), compileAggregationFinal(agg)])
          .filter(([, final]) => Boolean(final))
          .map(([name, final]) => `${name}: ${final}`)
          .join(",\n")}
			}
		}
	`;
}
