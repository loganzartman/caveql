import type { StreamstatsCommandAST } from "../../parser";
import {
  aggKey,
  compileAggregationCollect,
  compileAggregationFinal,
  compileAggregationInit,
} from "../compileAggregation";

export function compileStreamstatsCommand(
  command: StreamstatsCommandAST,
): string {
  return `
		function* (records) {
			const agg = {
				${command.aggregations.map((agg) => `${aggKey(agg)}: ${compileAggregationInit(agg)}`).join(",\n")}
			};

			let n = 0;
			for (const record of records) {
				++n;
				${command.aggregations.map(compileAggregationCollect).join(";\n")};

				yield {
					...record,
					${command.aggregations
            .map((agg) => [aggKey(agg), compileAggregationFinal(agg)])
            .filter(([, final]) => Boolean(final))
            .map(([name, final]) => `${name}: ${final}`)
            .join(",\n")}
				}
			}
		}
	`;
}
