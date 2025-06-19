export type StringAST = string;
export type NumericAST = number | bigint;
export type KvAST = {
	type: "kv";
	key: StringAST;
	value: ExpressionAST;
};

export type QueryAST = {
	type: "query";
	search?: SearchAST;
	next?: CommandAST;
};

export type SearchAST = {
	type: "search";
	filters: ExpressionAST[];
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

export type StatsAST = {
	type: "stats";
};

export type CommandAST = SearchAST | StatsAST;

export function takeSearch(src: string): [string, SearchAST] {
	const filters: ExpressionAST[] = [];
	for (let i = 0; i < 100; ++i) {
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
