import { impossible } from "./impossible";
import {
	type AggregationTermAST,
	asPath,
	type CommandAST,
	type EvalCommandAST,
	type ExpressionAST,
	type MakeresultsCommandAST,
	type QueryAST,
	type SearchCommandAST,
	type StatsCommandAST,
	type StreamstatsCommandAST,
	type WhereCommandAST,
} from "./parser";

export type QueryFunction = ((
	records: Iterable<unknown>,
) => Generator<Record<string, unknown>>) & { source: string };

const GeneratorFunction = function* () {}.constructor as {
	new (...args: string[]): GeneratorFunction;
};

export function compileQuery(query: QueryAST): QueryFunction {
	const source = compilePipeline(query.pipeline);
	const fn = new GeneratorFunction(
		"records",
		source,
	) as unknown as QueryFunction;
	fn.source = source;
	return fn;
}

function compilePipeline(pipeline: CommandAST[]): string {
	let result = "records";
	for (const command of pipeline) {
		result = `
			(
				${compileCommand(command)}
			)(
				${result}
			)
    `;
	}
	return `
		function looseEq(a, b) {
		  if (typeof a === 'string') a = a.toLowerCase();
			if (typeof b === 'string') b = b.toLowerCase();
			return a == b;
		}

		yield* (
			${result}
		);
	`;
}

function compileCommand(command: CommandAST): string {
	switch (command.type) {
		case "search":
			return compileSearchCommand(command);
		case "eval":
			return compileEvalCommand(command);
		case "makeresults":
			return compileMakeresultsCommand(command);
		case "where":
			return compileWhereCommand(command);
		case "stats":
			return compileStatsCommand(command);
		case "streamstats":
			return compileStreamstatsCommand(command);
		default:
			impossible(command);
	}
}

function compileSearchCommand(command: SearchCommandAST): string {
	if (command.filters.length === 0) {
		return "function*(records) { yield* records; }";
	}
	const conditions = command.filters
		.map((filter) => `(${compileCompareExpression(filter)})`)
		.join(" && ");
	return `
		function*(records) {
			for (const record of records) {
				if (
					${conditions}
				) {
					yield record;
				}
			}
		}
	`;
}

function compileEvalCommand(command: EvalCommandAST): string {
	const exprs = command.bindings
		.map(([prop, expr]) => {
			const path = asPath(prop);
			if (path.length === 1) {
				return `${JSON.stringify(path[0])}: (${compileExpression(expr)})`;
			}
			throw new Error("complex eval target not implemented");
		})
		.join(",\n");
	return `
		function*(records) {
			for (const record of records) {
				yield {
					...record,
					${exprs}
				};
			}
		}
	`;
}

function compileMakeresultsCommand(command: MakeresultsCommandAST): string {
	if (command.data) {
		let data: unknown[];
		if (command.format === "json") {
			data = JSON.parse(command.data.value);
		} else if (command.format === "csv") {
			throw new Error("makeresults format=csv not implemented");
		} else {
			impossible(command.format);
		}

		if (!Array.isArray(data)) {
			throw new Error("makeresults data must be an array");
		}

		const items = data.map((item) => {
			if (typeof item !== "object") {
				throw new Error("makeresults data items must be objects");
			}
			return {
				_raw: JSON.stringify(item),
				_time: new Date().toISOString(),
				...item,
			};
		});

		return `
      function*(records) {
        yield* records;
        yield* ${JSON.stringify(items)};
      }
    `;
	}

	return `
    function*(records) {
      yield* records;
      for (let i = 0; i < ${command.count.value}; ++i) {
        yield { _time: new Date().toISOString() };
      }
    }
  `;
}

function compileWhereCommand(_command: WhereCommandAST): string {
	throw new Error("where not implemented");
}

function compileStatsCommand(command: StatsCommandAST): string {
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

function aggKey(agg: AggregationTermAST) {
	if (agg.field === undefined) {
		return JSON.stringify(agg.type);
	}
	return JSON.stringify(`${agg.type}(${agg.field.value})`);
}

function compileAggregationInit(agg: AggregationTermAST): string {
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

function compileAggregationCollect(agg: AggregationTermAST): string {
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

function compileAggregationFinal(agg: AggregationTermAST): string | undefined {
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

function compileStreamstatsCommand(command: StreamstatsCommandAST): string {
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

function compileExpression(expr: ExpressionAST): string {
	switch (expr.type) {
		case "number":
			if (typeof expr.value === "bigint") {
				return `${expr.value}n`;
			}
			return `${expr.value}`;
		case "string":
			if (!expr.quoted) {
				const path = expr.value.split(".");
				return `record[${path.map((seg) => JSON.stringify(seg)).join("]?.[")}]`;
			}
			return JSON.stringify(expr.value);
		case "<":
		case "<=":
		case ">=":
		case ">":
			return `(${compileExpression(expr.left)} ${expr.type} ${compileExpression(expr.right)})`;
		case "!=":
			return `(${compileExpression(expr.left)} !== ${compileExpression(expr.right)})`;
		case "==":
		case "=":
			return `(${compileExpression(expr.left)} === ${compileExpression(expr.right)})`;
		case "and":
			return `(${compileExpression(expr.left)} && ${compileExpression(expr.right)})`;
		case "AND":
			throw new Error("Internal error: got 'AND' in expression");
		case "or":
			return `(${compileExpression(expr.left)} || ${compileExpression(expr.right)})`;
		case "OR":
			throw new Error("Internal error: got 'OR' in expression");
		case "not":
			return `(!${compileExpression(expr.operand)})`;
		case "NOT":
			throw new Error("Internal error: got 'NOT' in expression");
		case "%":
		case "+":
		case "-":
		case "*":
		case "/":
			return `(${compileExpression(expr.left)} ${expr.type} ${compileExpression(expr.right)})`;
		default:
			impossible(expr);
	}
}

function compileCompareExpression(
	expr: ExpressionAST,
	{
		lhs = false,
		comparison = false,
	}: { lhs?: boolean; comparison?: boolean } = {},
): string {
	switch (expr.type) {
		case "number":
			if (!comparison) {
				return `
					Object.entries(record)
						.flat()
						.some((v) => v == ${expr.value})
				`;
			}
			if (lhs) {
				throw new Error(
					`Don't use number ${expr.value} on the left-hand side. Consider reversing the comparison.`,
				);
			}
			if (typeof expr.value === "bigint") {
				return `${expr.value}n`;
			}
			return `${expr.value}`;
		case "string":
			if (!comparison) {
				return `
					Object.entries(record)
						.flat()
						.some((v) => looseEq(v, ${JSON.stringify(expr.value)}))
				`;
			}
			if (lhs || !expr.quoted) {
				const path = expr.value.split(".");
				return `record[${path.map((seg) => JSON.stringify(seg)).join("]?.[")}]`;
			}
			return JSON.stringify(expr.value);
		case "<":
		case "<=":
		case ">=":
		case ">":
			return `(${compileCompareExpression(expr.left, {
				lhs: true,
				comparison: true,
			})} ${expr.type} ${compileCompareExpression(expr.right, {
				comparison: true,
			})})`;
		case "!=":
			return `(!looseEq(${compileCompareExpression(expr.left, {
				lhs: true,
				comparison: true,
			})}, ${compileCompareExpression(expr.right, {
				comparison: true,
			})}))`;
		case "==":
			throw new Error(
				`Don't use '==' in comparison expressions. Use '=' instead.`,
			);
		case "=":
			return `(looseEq(${compileCompareExpression(expr.left, {
				lhs: true,
				comparison: true,
			})}, ${compileCompareExpression(expr.right, {
				comparison: true,
			})}))`;
		case "AND":
			return `(${compileCompareExpression(expr.left, {
				lhs: true,
				comparison: true,
			})} && ${compileCompareExpression(expr.right, {
				comparison: true,
			})})`;
		case "and":
			throw new Error("Internal error: got 'and' in compare expression");
		case "OR":
			return `(${compileCompareExpression(expr.left, {
				lhs: true,
				comparison: true,
			})} || ${compileCompareExpression(expr.right, {
				comparison: true,
			})})`;
		case "or":
			throw new Error("Internal error: got 'or' in compare expression");
		case "NOT":
			return `(!${compileCompareExpression(expr.operand)})`;
		case "not":
			throw new Error("Internal error: got 'not' in compare expression");
		case "%":
		case "+":
		case "-":
		case "*":
		case "/":
			return `(${compileCompareExpression(expr.left, { lhs: true })} ${expr.type} ${compileCompareExpression(expr.right)})`;
		default:
			impossible(expr);
	}
}

function must<T>(x: T | null | undefined, msg: string): T {
	if (x === null || x === undefined) {
		throw new Error(msg);
	}
	return x;
}
