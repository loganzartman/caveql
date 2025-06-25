import { formatJS } from "./formatJS";
import { impossible } from "./impossible";
import {
	asPath,
	type CommandAST,
	type EvalCommandAST,
	type ExpressionAST,
	type MakeresultsCommandAST,
	type QueryAST,
	type SearchCommandAST,
	type StatsCommandAST,
	type WhereCommandAST,
} from "./parser";

export function compileQuery(query: QueryAST): string {
	return formatJS(compilePipeline(query.pipeline));
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
		(function* run(records) {
			yield* (
				${result}
			);
    })
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
	throw new Error("not implemented");
}

function compileStatsCommand(_command: StatsCommandAST): string {
	throw new Error("not implemented");
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
	{ lhs = false }: { lhs?: boolean } = {},
): string {
	switch (expr.type) {
		case "number":
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
			if (lhs || !expr.quoted) {
				const path = expr.value.split(".");
				return `record[${path.map((seg) => JSON.stringify(seg)).join("]?.[")}]`;
			}
			return JSON.stringify(expr.value);
		case "<":
		case "<=":
		case ">=":
		case ">":
			return `(${compileCompareExpression(expr.left, { lhs: true })} ${expr.type} ${compileCompareExpression(expr.right)})`;
		case "!=":
			return `(${compileCompareExpression(expr.left, { lhs: true })} !== ${compileCompareExpression(expr.right)})`;
		case "==":
			throw new Error(
				`Don't use '==' in comparison expressions. Use '=' instead.`,
			);
		case "=":
			return `(${compileCompareExpression(expr.left, { lhs: true })} === ${compileCompareExpression(expr.right)})`;
		case "AND":
			return `(${compileCompareExpression(expr.left, { lhs: true })} && ${compileCompareExpression(expr.right)})`;
		case "and":
			throw new Error("Internal error: got 'and' in compare expression");
		case "OR":
			return `(${compileCompareExpression(expr.left, { lhs: true })} || ${compileCompareExpression(expr.right)})`;
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
