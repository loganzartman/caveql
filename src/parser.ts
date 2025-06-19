export type StringAST = string;
export type NumericAST = number | bigint;
export type KvAST = {
	type: "kv";
	key: StringAST;
	value: ExpressionAST;
};

export type QueryAST = {
	type: "query";
	search: SearchCommandAST;
	pipeline: CommandAST[];
};

export type ExpressionAST =
	| UnaryOpAST
	| BinaryOpAST
	| KvAST
	| StringAST
	| NumericAST;

export type UnaryOpType = "not";

export type UnaryOpAST = {
	type: UnaryOpType;
	operand: ExpressionAST;
};

export type BinaryOpType = "and" | "or";

export type BinaryOpAST = {
	type: BinaryOpType;
	left: ExpressionAST;
	right: ExpressionAST;
};

export type CommandAST = StatsCommandAST | SearchCommandAST | WhereCommandAST;

export type SearchCommandAST = {
	type: "search";
	filters: ExpressionAST[];
};

export type StatsCommandAST = {
	type: "stats";
};

export type WhereCommandAST = {
	type: "where";
	expr: ExpressionAST;
};

export function takeQuery(src: string): [string, QueryAST] {
	let search: SearchCommandAST;
	let pipeline: CommandAST[];
	[src] = takeWs(src);
	[src, search] = takeBareSearch(src);
	[src, pipeline] = takePipeline(src);

	return [
		src,
		{
			type: "query",
			search,
			pipeline,
		},
	];
}

export function takeSearchCommand(src: string): [string, SearchCommandAST] {
	let command: SearchCommandAST;
	[src] = takeWs(src);
	[src] = takeLiteral(src, "search");
	[src] = takeWs(src);
	[src, command] = takeBareSearch(src);

	return [src, command];
}

export function takeBareSearch(src: string): [string, SearchCommandAST] {
	const filters: ExpressionAST[] = [];
	while (true) {
		try {
			let filter: ExpressionAST;
			[src] = takeWs(src);
			[src, filter] = takeExpr(src);
			filters.push(filter);
		} catch {
			break;
		}
	}
	return [
		src,
		{
			type: "search",
			filters,
		},
	];
}

function takePipeline(src: string): [string, CommandAST[]] {
	const commands: CommandAST[] = [];
	while (true) {
		try {
			let command: CommandAST;
			[src] = takeWs(src);
			[src] = takeLiteral(src, "|");
			[src] = takeWs(src);
			[src, command] = takeCommand(src);
			commands.push(command);
		} catch {
			break;
		}
	}
	return [src, commands];
}

function takeCommand(src: string): [string, CommandAST] {
	return takeOne(src, takeStatsCommand, takeSearchCommand, takeWhereCommand);
}

function takeStatsCommand(src: string): [string, StatsCommandAST] {
	[src] = takeWs(src);
	[src] = takeLiteral(src, "stats");
	return [src, { type: "stats" }];
}

function takeWhereCommand(src: string): [string, WhereCommandAST] {
	let expr: ExpressionAST;
	[src] = takeWs(src);
	[src] = takeLiteral(src, "where");
	[src] = takeWs(src);
	[src, expr] = takeExpr(src);
	return [src, { type: "where", expr }];
}

function takeExpr(src: string): [string, ExpressionAST] {
	return takeOne(src, takeBinaryOp, takeUnaryOp, takeTerm);
}

function takeTerm(input: string): [string, ExpressionAST] {
	return takeOne(input, takeGroup, takeKv, takeNumeric, takeString);
}

function takeBinaryOp(input: string): [string, BinaryOpAST] {
	let op: BinaryOpType, left: ExpressionAST, right: ExpressionAST;
	[input] = takeWs(input);
	[input, left] = takeTerm(input);
	[input] = takeWs(input);
	[input, op] = takeOne(
		input,
		(s) => takeLiteral(s, "and"),
		(s) => takeLiteral(s, "or"),
	);
	[input] = takeWs(input);
	[input, right] = takeExpr(input);

	return [
		input,
		{
			type: op,
			left,
			right,
		},
	];
}

function takeUnaryOp(input: string): [string, UnaryOpAST] {
	let op: UnaryOpType, operand: ExpressionAST;
	[input] = takeWs(input);
	[input, op] = takeLiteral(input, "not");
	[input] = takeWs(input);
	[input, operand] = takeExpr(input);

	return [
		input,
		{
			type: op,
			operand,
		},
	];
}

function takeKv(input: string): [string, KvAST] {
	let key: StringAST, value: ExpressionAST;
	[input] = takeWs(input);
	[input, key] = takeString(input);
	[input] = takeWs(input);
	[input] = takeLiteral(input, "=");
	[input] = takeWs(input);
	[input, value] = takeTerm(input);

	return [
		input,
		{
			type: "kv",
			key,
			value,
		},
	];
}

function takeGroup(input: string): [string, ExpressionAST] {
	let expr: ExpressionAST;
	[input] = takeWs(input);
	[input] = takeLiteral(input, "(");
	[input] = takeWs(input);
	[input, expr] = takeExpr(input);
	[input] = takeWs(input);
	[input] = takeLiteral(input, ")");
	return [input, expr];
}

function takeString(input: string): [string, StringAST] {
	return takeOne(
		input,
		(s) => takeRex(s, /"((?:[^\\"]|\\.)*)"/, 1),
		(s) => takeRex(s, /'((?:[^\\']|\\.)*)'/, 1),
		(s) => takeRex(s, /[\p{L}$_\-.]+/u),
	);
}

function takeNumeric(input: string): [string, NumericAST] {
	return takeOne(
		input,
		(s) => {
			const [rest, numStr] = takeRex(s, /-?\d+\.\d*/);
			return [rest, Number.parseFloat(numStr)];
		},
		(s) => {
			const [rest, numStr] = takeRex(s, /-?\d+/);
			return [rest, BigInt(numStr)];
		},
	);
}

function takeWs(src: string): [string, string] {
	return takeRex(src, /\s*/);
}

function takeOne<TMembers extends ((input: string) => [string, any])[]>(
	input: string,
	...members: TMembers
): ReturnType<TMembers[number]> {
	for (const member of members) {
		try {
			return member(input) as ReturnType<TMembers[number]>;
		} catch {}
	}
	throw new Error("No matching members");
}

function takeRex(input: string, rex: RegExp, group = 0): [string, string] {
	const result = rex.exec(input);
	if (result?.index === 0) {
		if (result.length <= group) {
			throw new Error(`Regex did not contain group ${group} in ${rex}`);
		}
		return [input.substring(result[group].length), result[group]];
	}
	throw new Error(`Does not match regex ${rex}`);
}

function takeLiteral<T extends string>(input: string, match: T): [string, T] {
	if (input.startsWith(match)) {
		return [input.substring(match.length), match];
	}
	throw new Error(`Expected ${match}`);
}
