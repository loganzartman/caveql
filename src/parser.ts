export type Term = StringTerm | NumericTerm;
export type StringTerm = string;
export type NumericTerm = number | bigint;

export type QueryAST = {
	type: "query";
	search?: SearchAST;
	next?: CommandAST;
};

export type SearchAST = {
	type: "search";
	filters: FilterAST[];
};

export type FilterAST = UnaryOpAST | BinaryOpAST | KvAST;

export type UnaryOpType = "not";

export type UnaryOpAST = {
	type: UnaryOpType;
	operand: FilterAST;
};

export type BinaryOpType = "and" | "or";

export type BinaryOpAST = {
	type: BinaryOpType;
	left: FilterAST;
	right: FilterAST;
};

export type KvAST = {
	type: "kv";
	key: StringTerm;
	value: Term;
};

export type StatsAST = {
	type: "stats";
};

export type CommandAST = SearchAST | StatsAST;

export function takeSearch(src: string): [string, SearchAST] {
	const filters: FilterAST[] = [];
	for (let i = 0; i < 100; ++i) {
		try {
			let filter: FilterAST;
			[src] = takeWs(src);
			[src, filter] = takeFilter(src);
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

function takeFilter(src: string): [string, FilterAST] {
	return takeOne(src, takeBinaryOp, takeUnaryOp, takeKv);
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

function takeKv(input: string): [string, KvAST] {
	let key: StringTerm, value: Term;
	[input] = takeWs(input);
	[input, key] = takeStringTerm(input);
	[input] = takeWs(input);
	[input] = takeStr(input, "=");
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

function takeUnaryOp(input: string): [string, UnaryOpAST] {
	let op: UnaryOpType, operand: FilterAST;
	[input] = takeWs(input);
	[input, op] = takeStr(input, "not");
	[input] = takeWs(input);
	[input, operand] = takeFilter(input);

	return [
		input,
		{
			type: op,
			operand,
		},
	];
}

function takeBinaryOp(input: string): [string, BinaryOpAST] {
	let op: BinaryOpType, left: KvAST, right: FilterAST;
	[input] = takeWs(input);
	[input, left] = takeKv(input);
	[input] = takeWs(input);
	[input, op] = takeOne(
		input,
		(s) => takeStr(s, "and"),
		(s) => takeStr(s, "or"),
	);
	[input] = takeWs(input);
	[input, right] = takeFilter(input);

	return [
		input,
		{
			type: op,
			left,
			right,
		},
	];
}

function takeTerm(input: string): [string, Term] {
	return takeOne(
		input,
		(s) => takeNumericTerm(s),
		(s) => takeStringTerm(s),
	);
}

function takeStringTerm(input: string): [string, StringTerm] {
	return takeOne(
		input,
		(s) => takeRex(s, /"((?:[^\\"]|\\.)*)"/, 1),
		(s) => takeRex(s, /'((?:[^\\']|\\.)*)'/, 1),
		(s) => takeRex(s, /[\p{L}$_\-.]+/u),
	);
}

function takeNumericTerm(input: string): [string, NumericTerm] {
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

function takeStr<T extends string>(input: string, match: T): [string, T] {
	if (input.startsWith(match)) {
		return [input.substring(match.length), match];
	}
	throw new Error(`Expected ${match}`);
}
