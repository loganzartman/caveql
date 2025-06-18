import { type SearchAST, takeSearch } from "./parser";

export function parse(src: string): SearchAST {
	return takeSearch(src)[1];
}

export { formatTree } from "./formatTree";
