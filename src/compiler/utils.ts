import type { StringAST } from "../parser";

export function must<T>(x: T | null | undefined, msg: string): T {
  if (x === null || x === undefined) {
    throw new Error(msg);
  }
  return x;
}

export function asPath(stringAST: StringAST): string[] {
  return stringAST.value.split(".").map((seg) => {
    if (seg.length === 0) {
      throw new Error("Empty segment in path");
    }
    return seg;
  });
}

export function asPathAccessor(stringAST: StringAST): string {
  return asPath(stringAST)
    .map((seg) => `?.[${JSON.stringify(seg)}]`)
    .join("");
}
