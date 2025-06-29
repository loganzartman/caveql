export type TreeLeaf = string | number | bigint | boolean | undefined;

export type TreeNode = TreeLeaf | TreeNode[] | { [k: string]: TreeNode };

const targetLength = 40;

export function formatTree(x: TreeNode, depth = 0): string {
  if (x === undefined) {
    return "";
  }

  if (
    typeof x === "string" ||
    typeof x === "number" ||
    typeof x === "bigint" ||
    typeof x === "boolean"
  ) {
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

  const items = Object.entries(x)
    .filter(([, v]) => v !== "undefined")
    .map(([k, v]) => `${k}: ${formatTree(v, 0)}`);
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
