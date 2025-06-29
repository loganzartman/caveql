export type ParseContext = {
	source: string;
	index: number;
	compareExpr: boolean;
};

export type QueryAST = {
	type: "query";
	pipeline: CommandAST[];
};

export function parseQuery(src: string): QueryAST {
	const ctx = {
		source: src,
		index: 0,
		compareExpr: false,
	};
	return parseQuery_(ctx);
}

function parseQuery_(ctx: ParseContext): QueryAST {
	const pipeline = parsePipeline(ctx);

	return {
		type: "query",
		pipeline,
	};
}

function parsePipeline(ctx: ParseContext): CommandAST[] {
	const commands: CommandAST[] = [];
	let first = true;
	while (true) {
		try {
			parseWs(ctx);
			// allow bare search without the search keyword
			const command = first
				? parseOne(ctx, parseCommand, parseBareSearch)
				: parseCommand(ctx);
			commands.push(command);
			parseWs(ctx);
			parseLiteral(ctx, "|");
		} catch {
			break;
		}
		first = false;
	}
	return commands;
}

export type CommandAST =
	| EvalCommandAST
	| MakeresultsCommandAST
	| SearchCommandAST
	| StatsCommandAST
	| StreamstatsCommandAST
	| WhereCommandAST;

function parseCommand(ctx: ParseContext): CommandAST {
	return parseOne(
		ctx,
		parseEvalCommand,
		parseMakeresultsCommand,
		parseSearchCommand,
		parseStatsCommand,
		parseStreamstatsCommand,
		parseWhereCommand,
	);
}

export type SearchCommandAST = {
	type: "search";
	filters: ExpressionAST[];
};

function parseSearchCommand(ctx: ParseContext): SearchCommandAST {
	parseWs(ctx);
	parseLiteral(ctx, "search");
	parseWs(ctx);
	return parseBareSearch(ctx);
}

function parseBareSearch(ctx: ParseContext): SearchCommandAST {
	const filters: ExpressionAST[] = [];
	while (true) {
		try {
			parseWs(ctx);
			ctx.compareExpr = true;
			const filter = parseExpr(ctx);
			filters.push(filter);
		} catch {
			break;
		} finally {
			ctx.compareExpr = false;
		}
	}
	return {
		type: "search",
		filters,
	};
}

export type StatsCommandAST = {
	type: "stats";
	aggregations: AggregationTermAST[];
};

function parseStatsCommand(ctx: ParseContext): StatsCommandAST {
	parseWs(ctx);
	parseLiteral(ctx, "stats");

	const terms: AggregationTermAST[] = [];
	while (true) {
		try {
			parseWs(ctx);
			const term = parseAggregationTerm(ctx);
			terms.push(term);
		} catch {
			break;
		}
	}
	return { type: "stats", aggregations: terms };
}

export type AggregationTermType =
	| "count"
	| "distinct"
	| "sum"
	| "avg"
	| "min"
	| "max"
	| "mode"
	| "median"
	| "perc";

export type AggregationTermAST = {
	type: AggregationTermType;
	field?: StringAST;
};

function parseAggregationTerm(ctx: ParseContext): AggregationTermAST {
	parseWs(ctx);
	const type = parseLiteral(
		ctx,
		"count",
		"distinct",
		"sum",
		"avg",
		"min",
		"max",
		"mode",
		"median",
		"perc",
	);

	let field: StringAST | undefined;
	try {
		parseWs(ctx);
		parseLiteral(ctx, "(");
		parseWs(ctx);
		field = parseString(ctx);
		parseWs(ctx);
		parseLiteral(ctx, ")");
	} catch {
		// pass
	}

	return { type, field };
}

export type StreamstatsCommandAST = {
	type: "streamstats";
	aggregations: AggregationTermAST[];
};

function parseStreamstatsCommand(ctx: ParseContext): StreamstatsCommandAST {
	parseWs(ctx);
	parseLiteral(ctx, "streamstats");

	const terms: AggregationTermAST[] = [];
	while (true) {
		try {
			parseWs(ctx);
			const term = parseAggregationTerm(ctx);
			terms.push(term);
		} catch {
			break;
		}
	}
	return { type: "streamstats", aggregations: terms };
}

export type WhereCommandAST = {
	type: "where";
	expr: ExpressionAST;
};

function parseWhereCommand(ctx: ParseContext): WhereCommandAST {
	parseWs(ctx);
	parseLiteral(ctx, "where");
	parseWs(ctx);
	const expr = parseExpr(ctx);
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

function parseMakeresultsCommand(ctx: ParseContext): MakeresultsCommandAST {
	parseWs(ctx);
	parseLiteral(ctx, "makeresults");

	let count: NumericAST = { type: "number", value: 1n };
	let format: "csv" | "json" | undefined;
	let data: StringAST | undefined;

	while (true) {
		try {
			parseWs(ctx);
			parseOne(
				ctx,
				(c) => {
					count = parseParam(c, "count", parseNumeric);
				},
				(c) => {
					format = parseParam(c, "format", (c) =>
						parseLiteral(c, "csv", "json"),
					);
				},
				(c) => {
					data = parseParam(c, "data", parseString);
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

function parseEvalCommand(ctx: ParseContext): EvalCommandAST {
	parseWs(ctx);
	parseLiteral(ctx, "eval");

	const bindings: [StringAST, ExpressionAST][] = [];
	while (true) {
		try {
			parseWs(ctx);
			const name = parseString(ctx);
			parseWs(ctx);
			parseLiteral(ctx, "=");
			parseWs(ctx);
			const expr = parseExpr(ctx);
			bindings.push([name, expr]);

			parseWs(ctx);
			parseLiteral(ctx, ",");
		} catch {
			break;
		}
	}

	return { type: "eval", bindings };
}

export type ExpressionAST = UnaryOpAST | BinaryOpAST | NumericAST | StringAST;

function parseExpr(ctx: ParseContext): ExpressionAST {
	return parseOrExpr(ctx);
}

function parseTerm(ctx: ParseContext): ExpressionAST {
	return parseOne(ctx, parseGroup, parseNumeric, parseString);
}

export type BinaryOpType =
	| "and"
	| "or"
	| "AND"
	| "OR"
	| "="
	| "=="
	| ">"
	| "<"
	| ">="
	| "<="
	| "!="
	| "+"
	| "-"
	| "*"
	| "/"
	| "%";

export type BinaryOpAST = {
	type: BinaryOpType;
	left: ExpressionAST;
	right: ExpressionAST;
};

function parseOrExpr(ctx: ParseContext): ExpressionAST {
	if (ctx.compareExpr) {
		return parseBinaryLevel(ctx, parseAndExpr, ["OR"]);
	}
	return parseBinaryLevel(ctx, parseAndExpr, ["or"]);
}

function parseAndExpr(ctx: ParseContext): ExpressionAST {
	if (ctx.compareExpr) {
		return parseBinaryLevel(ctx, parseEqualityExpr, ["AND"]);
	}
	return parseBinaryLevel(ctx, parseEqualityExpr, ["and"]);
}

function parseEqualityExpr(ctx: ParseContext): ExpressionAST {
	return parseBinaryLevel(ctx, parseComparisonExpr, ["!=", "==", "="]);
}

function parseComparisonExpr(ctx: ParseContext): ExpressionAST {
	return parseBinaryLevel(ctx, parseAdditiveExpr, [">=", "<=", ">", "<"]);
}

function parseAdditiveExpr(ctx: ParseContext): ExpressionAST {
	return parseBinaryLevel(ctx, parseMultiplicativeExpr, ["+", "-"]);
}

function parseMultiplicativeExpr(ctx: ParseContext): ExpressionAST {
	return parseBinaryLevel(ctx, parseUnaryExpr, ["*", "/", "%"]);
}

function parseBinaryLevel(
	ctx: ParseContext,
	nextLevel: (ctx: ParseContext) => ExpressionAST,
	operators: BinaryOpType[],
): ExpressionAST {
	let left = nextLevel(ctx);

	while (true) {
		try {
			parseWs(ctx);
			const op = parseLiteral(ctx, ...operators);
			parseWs(ctx);
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

export type UnaryOpType = "not" | "NOT";

export type UnaryOpAST = {
	type: UnaryOpType;
	operand: ExpressionAST;
};

function parseUnaryExpr(ctx: ParseContext): ExpressionAST {
	try {
		parseWs(ctx);
		let op: UnaryOpType;
		if (ctx.compareExpr) {
			op = parseLiteral(ctx, "NOT");
		} else {
			op = parseLiteral(ctx, "not");
		}

		parseWs(ctx);
		const operand = parseExpr(ctx);
		return {
			type: op,
			operand,
		};
	} catch {
		return parseTerm(ctx);
	}
}

function parseParam<T>(
	ctx: ParseContext,
	param: string,
	parseValue: (ctx: ParseContext) => T,
): T {
	parseWs(ctx);
	parseLiteral(ctx, param);
	parseWs(ctx);
	parseLiteral(ctx, "=");
	parseWs(ctx);
	return parseValue(ctx);
}

function parseGroup(ctx: ParseContext): ExpressionAST {
	parseWs(ctx);
	parseLiteral(ctx, "(");
	parseWs(ctx);
	const expr = parseExpr(ctx);
	parseWs(ctx);
	parseLiteral(ctx, ")");
	return expr;
}

export type StringAST = { type: "string"; quoted: boolean; value: string };

function parseString(ctx: ParseContext): StringAST {
	return parseOne(
		ctx,
		(c) =>
			({
				type: "string",
				quoted: true,
				value: parseRex(c, /"((?:[^\\"]|\\.)*)"/, 1),
			}) as const,
		(c) =>
			({
				type: "string",
				quoted: true,
				value: parseRex(c, /'((?:[^\\']|\\.)*)'/, 1),
			}) as const,
		(c) =>
			({
				type: "string",
				quoted: false,
				value: parseRex(c, /[\p{L}$_][\p{L}\p{N}\-$_.]*/u),
			}) as const,
	);
}

export function asPath(stringAST: StringAST): string[] {
	return stringAST.value.split(".").map((seg) => {
		if (seg.length === 0) {
			throw new Error("Empty segment in path");
		}
		return seg;
	});
}

export type NumericAST = { type: "number"; value: number | bigint };

function parseNumeric(ctx: ParseContext): NumericAST {
	return parseOne(
		ctx,
		(c) => {
			const numStr = parseRex(c, /-?\d+\.\d*/);
			return { type: "number", value: Number.parseFloat(numStr) } as const;
		},
		(c) => {
			const numStr = parseRex(c, /-?\d+/);
			return { type: "number", value: BigInt(numStr) } as const;
		},
	);
}

function parseWs(ctx: ParseContext): string {
	return parseRex(ctx, /\s*/);
}

function parseOne<TMembers extends ((ctx: ParseContext) => unknown)[]>(
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

function parseRex(ctx: ParseContext, rex: RegExp, group = 0): string {
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

function parseLiteral<T extends string[]>(
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
