import type { ParseContext } from "./types";

export function parseParam<T>(
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

export type StringAST = { type: "string"; quoted: boolean; value: string };

export function parseString(ctx: ParseContext): StringAST {
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

export type NumericAST = { type: "number"; value: number | bigint };

export function parseNumeric(ctx: ParseContext): NumericAST {
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

export function parseWs(ctx: ParseContext): string {
  return parseRex(ctx, /\s*/);
}

export function parseOne<TMembers extends ((ctx: ParseContext) => unknown)[]>(
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

export function parseRex(ctx: ParseContext, rex: RegExp, group = 0): string {
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

export function parseLiteral<T extends string[]>(
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
