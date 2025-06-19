import { type QueryAST, takeQuery } from "./parser";

export function parse(src: string): QueryAST {
	return takeQuery(src)[1];
}

export { formatTree } from "./formatTree";
