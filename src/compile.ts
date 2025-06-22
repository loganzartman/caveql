import { formatJS } from "./formatJS";
import { impossible } from "./impossible";
import type {
	CommandAST,
	EvalCommandAST,
	ExpressionAST,
	MakeresultsCommandAST,
	QueryAST,
	SearchCommandAST,
	StatsCommandAST,
	WhereCommandAST,
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
		console.log(result);
	}
	return `
		function* run(records) {
			yield* (
				${result}
			);
		}
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
		.map((filter) => `(${compileExpression(filter)})`)
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
			if (prop.path.length === 1) {
				return `${JSON.stringify(prop.path[0])}: (${compileExpression(expr)})`;
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
	throw new Error("not implemented");
}

function compileWhereCommand(command: WhereCommandAST): string {
	throw new Error("not implemented");
}

function compileStatsCommand(command: StatsCommandAST): string {
	throw new Error("not implemented");
}

export function compileExpression(expr: ExpressionAST): string {
	switch (expr.type) {
		case "prop":
			return `record[${expr.path.map((seg) => JSON.stringify(seg)).join("]?.[")}]`;
		case "val":
			if (typeof expr.value === "bigint") {
				return `${expr.value}n`;
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
		case "or":
			return `(${compileExpression(expr.left)} || ${compileExpression(expr.right)})`;
		case "not":
			return `(!${compileExpression(expr.operand)})`;
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
