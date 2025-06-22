export type ParseContext = {
	source: string;
	index: number;
};

export type QueryAST = {
	type: "query";
	pipeline: CommandAST[];
};

export function parseQuery(src: string): QueryAST {
	const ctx = {
		source: src,
		index: 0,
	};
	return takeQuery(ctx);
}

export function takeQuery(ctx: ParseContext): QueryAST {
	const pipeline = takePipeline(ctx);

	return {
		type: "query",
		pipeline,
	};
}

function takePipeline(ctx: ParseContext): CommandAST[] {
	const commands: CommandAST[] = [];
	while (true) {
		try {
			takeWs(ctx);
			const command = takeCommand(ctx);
			commands.push(command);
			takeWs(ctx);
			takeLiteral(ctx, "|");
		} catch {
			break;
		}
	}
	return commands;
}

export type CommandAST = StatsCommandAST | SearchCommandAST | WhereCommandAST;

function takeCommand(ctx: ParseContext): CommandAST {
	return takeOne(ctx, takeStatsCommand, takeSearchCommand, takeWhereCommand);
}

export type SearchCommandAST = {
	type: "search";
	filters: ExpressionAST[];
};

function takeSearchCommand(ctx: ParseContext): SearchCommandAST {
	takeWs(ctx);
	takeLiteral(ctx, "search");
	takeWs(ctx);
	return takeBareSearch(ctx);
}

function takeBareSearch(ctx: ParseContext): SearchCommandAST {
	const filters: ExpressionAST[] = [];
	while (true) {
		try {
			takeWs(ctx);
			const filter = takeExpr(ctx);
			filters.push(filter);
		} catch {
			break;
		}
	}
	return {
		type: "search",
		filters,
	};
}

export type StatsCommandAST = {
	type: "stats";
};

function takeStatsCommand(ctx: ParseContext): StatsCommandAST {
	takeWs(ctx);
	takeLiteral(ctx, "stats");
	return { type: "stats" };
}

export type WhereCommandAST = {
	type: "where";
	expr: ExpressionAST;
};

function takeWhereCommand(ctx: ParseContext): WhereCommandAST {
	takeWs(ctx);
	takeLiteral(ctx, "where");
	takeWs(ctx);
	const expr = takeExpr(ctx);
	return { type: "where", expr };
}

export type UnaryOpType = "not";

export type UnaryOpAST = {
	type: UnaryOpType;
	operand: ExpressionAST;
};

export type ExpressionAST =
	| UnaryOpAST
	| BinaryOpAST
	| KeyValueAST
	| NumericAST
	| StringAST;

export type KeyValueAST = {
	type: "kv";
	key: string;
	value: ExpressionAST;
};

function takeExpr(ctx: ParseContext): ExpressionAST {
	return takeOrExpr(ctx);
}

function takeTerm(ctx: ParseContext): ExpressionAST {
	return takeOne(ctx, takeGroup, takeNumeric, takeString);
}

export type BinaryOpType =
	| "and"
	| "or"
	| "="
	| "=="
	| ">"
	| "<"
	| ">="
	| "<="
	| "!=";

export type BinaryOpAST = {
	type: BinaryOpType;
	left: ExpressionAST;
	right: ExpressionAST;
};

// Precedence levels (lowest to highest):
// 1. OR
// 2. AND
// 3. Equality (=, ==, !=)
// 4. Comparison (<, <=, >, >=)
// 5. Unary (not)
// 6. Terms (parentheses, literals)

function takeOrExpr(ctx: ParseContext): ExpressionAST {
	return takeBinaryLevel(takeAndExpr, ["or"])(ctx);
}

function takeAndExpr(ctx: ParseContext): ExpressionAST {
	return takeBinaryLevel(takeEqualityExpr, ["and"])(ctx);
}

function takeEqualityExpr(ctx: ParseContext): ExpressionAST {
	return takeBinaryLevel(takeComparisonExpr, ["!=", "=="])(ctx);
}

function takeComparisonExpr(ctx: ParseContext): ExpressionAST {
	return takeBinaryLevel(takeUnaryExpr, [">=", "<=", ">", "<"])(ctx);
}

function takeKeyValue(ctx: ParseContext): KeyValueAST {
	const originalIndex = ctx.index;
	try {
		takeWs(ctx);
		const key = takeString(ctx);
		takeWs(ctx);
		takeLiteral(ctx, "=");
		takeWs(ctx);
		const value = takeTerm(ctx);

		return {
			type: "kv",
			key,
			value,
		};
	} catch (e) {
		ctx.index = originalIndex;
		throw e;
	}
}

function takeUnaryExpr(ctx: ParseContext): ExpressionAST {
	try {
		takeWs(ctx);
		const op = takeLiteral(ctx, "not");
		takeWs(ctx);
		const operand = takeUnaryExpr(ctx); // Right-associative for unary ops
		return {
			type: op,
			operand,
		};
	} catch {
		// Try key-value first, then fall back to term
		try {
			return takeKeyValue(ctx);
		} catch {
			return takeTerm(ctx);
		}
	}
}

export type ParamAST = {
	type: "param";
	key: StringAST;
	value: ExpressionAST;
};

function takeParam(ctx: ParseContext): ParamAST {
	takeWs(ctx);
	const key = takeString(ctx);
	takeWs(ctx);
	takeLiteral(ctx, "=");
	takeWs(ctx);
	const value = takeTerm(ctx);

	return {
		type: "param",
		key,
		value,
	};
}

function takeGroup(ctx: ParseContext): ExpressionAST {
	takeWs(ctx);
	takeLiteral(ctx, "(");
	takeWs(ctx);
	const expr = takeExpr(ctx);
	takeWs(ctx);
	takeLiteral(ctx, ")");
	return expr;
}

export type StringAST = string;

function takeString(ctx: ParseContext): StringAST {
	return takeOne(
		ctx,
		(c) => takeRex(c, /"((?:[^\\"]|\\.)*)"/, 1),
		(c) => takeRex(c, /'((?:[^\\']|\\.)*)'/, 1),
		(c) => takeRex(c, /[\p{L}$_\-.]+/u),
	);
}

export type NumericAST = number | bigint;

function takeNumeric(ctx: ParseContext): NumericAST {
	return takeOne(
		ctx,
		(c) => {
			const numStr = takeRex(c, /-?\d+\.\d*/);
			return Number.parseFloat(numStr);
		},
		(c) => {
			const numStr = takeRex(c, /-?\d+/);
			return BigInt(numStr);
		},
	);
}

function takeWs(ctx: ParseContext): string {
	return takeRex(ctx, /\s*/);
}

function takeOne<TMembers extends ((ctx: ParseContext) => unknown)[]>(
	ctx: ParseContext,
	...members: TMembers
): ReturnType<TMembers[number]> {
	const originalIndex = ctx.index;
	for (const member of members) {
		try {
			return member(ctx) as ReturnType<TMembers[number]>;
		} catch {
			ctx.index = originalIndex;
		}
	}
	throw new Error("No matching members");
}

function takeBinaryLevel(
	nextLevel: (ctx: ParseContext) => ExpressionAST,
	operators: string[],
): (ctx: ParseContext) => ExpressionAST {
	return (ctx: ParseContext) => {
		let left = nextLevel(ctx);

		while (true) {
			try {
				takeWs(ctx);
				const op = takeLiteral(ctx, ...operators);
				takeWs(ctx);
				const right = nextLevel(ctx);
				left = {
					type: op as BinaryOpType,
					left,
					right,
				};
			} catch {
				break;
			}
		}

		return left;
	};
}

function takeRex(ctx: ParseContext, rex: RegExp, group = 0): string {
	const remaining = ctx.source.substring(ctx.index);
	const result = rex.exec(remaining);
	if (result?.index === 0) {
		if (result.length <= group) {
			throw new Error(`Regex did not contain group ${group} in ${rex}`);
		}
		ctx.index += result[0].length;
		return result[group];
	}
	throw new Error(`Does not match regex ${rex}`);
}

function takeLiteral<T extends string[]>(
	ctx: ParseContext,
	...match: T
): T[number] {
	const remaining = ctx.source.substring(ctx.index);
	for (const m of match) {
		if (remaining.startsWith(m)) {
			ctx.index += m.length;
			return m;
		}
	}
	throw new Error(`Expected ${match}`);
}
