export function must<T>(x: T | null | undefined, msg: string): T {
  if (x === null || x === undefined) {
    throw new Error(msg);
  }
  return x;
}

export function asPath(pathStr: string): string[] {
  if (pathStr.length === 0) {
    return [];
  }
  return pathStr.split(".").map((seg) => {
    if (seg.length === 0) {
      throw new Error("Empty segment in path");
    }
    return seg;
  });
}

export function compilePathGet(target: string, pathStr: string): string {
  return `(${target})${asPath(pathStr)
    .map((seg) => `?.[${JSON.stringify(seg)}]`)
    .join("")}`;
}

export function compilePathSet(
  target: string,
  pathStr: string,
  value: string,
): string {
  const path = asPath(pathStr);
  return [
    ...path.slice(1).map((_, i) => {
      const prefix = path.slice(0, i + 1);
      return `(${target})${prefix.map((seg) => `[${JSON.stringify(seg)}]`).join("")} ??= {};`;
    }),
    `(${target})${path.map((seg) => `[${JSON.stringify(seg)}]`).join("")} = (${value});`,
  ].join("\n");
}
