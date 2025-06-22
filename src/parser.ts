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

export type CommandAST =
	| EvalCommandAST
	| MakeresultsCommandAST
	| SearchCommandAST
	| StatsCommandAST
	| WhereCommandAST;

function takeCommand(ctx: ParseContext): CommandAST {
	return takeOne(
		ctx,
		takeEvalCommand,
		takeMakeresultsCommand,
		takeSearchCommand,
		takeStatsCommand,
		takeWhereCommand,
	);
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

export type MakeresultsCommandAST = {
	type: "makeresults";
	count: NumericAST;
} & (
	| {
			format: "csv" | "json";
			data: StringAST;
	  }
	| {
			format?: undefined;
			data?: undefined;
	  }
);

function takeMakeresultsCommand(ctx: ParseContext): MakeresultsCommandAST {
	takeWs(ctx);
	takeLiteral(ctx, "makeresults");

	let count: NumericAST = 1n;
	let format: "csv" | "json" | undefined;
	let data: StringAST | undefined;

	while (true) {
		try {
			takeWs(ctx);
			takeOne(
				ctx,
				(c) => {
					count = takeParam(c, "count", takeNumeric);
				},
				(c) => {
					format = takeParam(c, "format", (c) => takeLiteral(c, "csv", "json"));
				},
				(c) => {
					data = takeParam(c, "data", takeString);
				},
			);
		} catch {
			break;
		}
	}

	if (format !== undefined || data !== undefined) {
		if (format === undefined || data === undefined) {
			throw new Error("If format or data is specified, both must be specified");
		}
		return {
			type: "makeresults",
			count,
			format,
			data,
		};
	}
	return {
		type: "makeresults",
		count,
	};
}

export type EvalCommandAST = {
	type: "eval";
	bindings: [StringAST, ExpressionAST][];
};

function takeEvalCommand(ctx: ParseContext): EvalCommandAST {
	takeWs(ctx);
	takeLiteral(ctx, "eval");

	const bindings: [StringAST, ExpressionAST][] = [];
	while (true) {
		try {
			takeWs(ctx);
			const name = takeString(ctx);
			takeWs(ctx);
			takeLiteral(ctx, "=");
			takeWs(ctx);
			const expr = takeExpr(ctx);
			bindings.push([name, expr]);

			takeWs(ctx);
			takeLiteral(ctx, ",");
		} catch {
			break;
		}
	}

	return { type: "eval", bindings };
}

export type ExpressionAST = UnaryOpAST | BinaryOpAST | NumericAST | StringAST;

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

function takeOrExpr(ctx: ParseContext): ExpressionAST {
	return takeBinaryLevel(ctx, takeAndExpr, ["or"]);
}

function takeAndExpr(ctx: ParseContext): ExpressionAST {
	return takeBinaryLevel(ctx, takeEqualityExpr, ["and"]);
}

function takeEqualityExpr(ctx: ParseContext): ExpressionAST {
	return takeBinaryLevel(ctx, takeComparisonExpr, ["!=", "==", "="]);
}

function takeComparisonExpr(ctx: ParseContext): ExpressionAST {
	return takeBinaryLevel(ctx, takeAdditiveExpr, [">=", "<=", ">", "<"]);
}

function takeAdditiveExpr(ctx: ParseContext): ExpressionAST {
	return takeBinaryLevel(ctx, takeMultiplicativeExpr, ["+", "-"]);
}

function takeMultiplicativeExpr(ctx: ParseContext): ExpressionAST {
	return takeBinaryLevel(ctx, takeUnaryExpr, ["*", "/", "%"]);
}

function takeBinaryLevel(
	ctx: ParseContext,
	nextLevel: (ctx: ParseContext) => ExpressionAST,
	operators: string[],
): ExpressionAST {
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
}

export type UnaryOpType = "not";

export type UnaryOpAST = {
	type: UnaryOpType;
	operand: ExpressionAST;
};

function takeUnaryExpr(ctx: ParseContext): ExpressionAST {
	try {
		takeWs(ctx);
		const op = takeLiteral(ctx, "not");
		takeWs(ctx);
		const operand = takeUnaryExpr(ctx);
		return {
			type: op,
			operand,
		};
	} catch {
		return takeTerm(ctx);
	}
}

function takeParam<T>(
	ctx: ParseContext,
	param: string,
	takeValue: (ctx: ParseContext) => T,
): T {
	takeWs(ctx);
	takeLiteral(ctx, param);
	takeWs(ctx);
	takeLiteral(ctx, "=");
	takeWs(ctx);
	return takeValue(ctx);
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
