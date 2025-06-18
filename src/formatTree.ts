export type TreeLeaf = string | number;

export type TreeNode = TreeLeaf | TreeNode[] | { [k: string]: TreeNode };

const targetLength = 60;

export function formatTree(x: TreeNode, depth = 0): string {
	if (typeof x === "string" || typeof x === "number") {
		return String(x);
	}

	if (Array.isArray(x)) {
		const items = x.map((e) => formatTree(e, 0));
		if (items.reduce((len, e) => len + e.length, 0) < targetLength) {
			return `[ ${items.join(", ")} ]`;
		}
		return [
			"[",
			...x.map((e) => indent(formatTree(e, depth + 1), depth + 1)),
			indent("]", depth),
		].join("\n");
	}

	const items = Object.entries(x).map(([k, v]) => `${k}: ${formatTree(v, 0)}`);
	if (items.reduce((len, e) => len + e.length, 0) < targetLength) {
		return `{ ${items.join(", ")} }`;
	}
	return [
		"{",
		...Object.entries(x).map(([k, v]) =>
			indent(`${k}: ${formatTree(v, depth + 1)}`, depth + 1),
		),
		indent("}", depth),
	].join("\n");
}

function indent(s: string, len: number): string {
	return `${"  ".repeat(len)}${s}`;
}
