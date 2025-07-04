import { Token } from "../tokens";
import type { ParseContext } from "./types";

function save(ctx: ParseContext): () => void {
  const index0 = ctx.index;
  const tokensLen0 = ctx.tokens.length;
  return () => {
    ctx.index = index0;
    ctx.tokens.length = tokensLen0;
  };
}

export function parseParam<T>(
  ctx: ParseContext,
  param: string,
  parseValue: (ctx: ParseContext) => T,
): T {
  parseWs(ctx);
  parseLiteral(ctx, [Token.parameter, param]);
  parseWs(ctx);
  parseLiteral(ctx, [Token.operator, "="]);
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
        value: parseRex(c, Token.string, /"((?:[^\\"]|\\.)*)"/, 1),
      }) as const,
    (c) =>
      ({
        type: "string",
        quoted: true,
        value: parseRex(c, Token.string, /'((?:[^\\']|\\.)*)'/, 1),
      }) as const,
    (c) =>
      ({
        type: "string",
        quoted: false,
        value: parseRex(c, Token.string, /[\p{L}$_][\p{L}\p{N}\-$_.]*/u),
      }) as const,
  );
}

export type NumericAST = { type: "number"; value: number | bigint };

export function parseNumeric(ctx: ParseContext): NumericAST {
  return parseOne(
    ctx,
    (c) => {
      const numStr = parseRex(c, Token.number, /-?\d+\.\d*/);
      return { type: "number", value: Number.parseFloat(numStr) } as const;
    },
    (c) => {
      const numStr = parseRex(c, Token.number, /-?\d+/);
      return { type: "number", value: BigInt(numStr) } as const;
    },
  );
}

export function parseWs(ctx: ParseContext): string {
  return parseRex(ctx, Token.whitespace, /\s*/);
}

export function parseOne<TMembers extends ((ctx: ParseContext) => unknown)[]>(
  ctx: ParseContext,
  ...members: TMembers
): ReturnType<TMembers[number]> {
  const restore = save(ctx);
  for (const member of members) {
    try {
      return member(ctx) as ReturnType<TMembers[number]>;
    } catch {
      restore();
    }
  }
  throw new Error("No matching members");
}

export function parseOptional<T>(
  ctx: ParseContext,
  parseFn: (ctx: ParseContext) => T,
): T | undefined {
  try {
    return parseFn(ctx);
  } catch {
    return undefined;
  }
}

export function parseRex(
  ctx: ParseContext,
  token: Token,
  rex: RegExp,
  group = 0,
): string {
  const remaining = ctx.source.substring(ctx.index);
  const result = rex.exec(remaining);
  if (result?.index === 0) {
    if (result.length <= group) {
      throw new Error(`Regex did not contain group ${group} in ${rex}`);
    }
    if (result[0].length > 0) {
      ctx.tokens.push({
        type: token,
        start: ctx.index,
        end: ctx.index + result[0].length,
      });
    }
    ctx.index += result[0].length;
    return result[group];
  }
  throw new Error(`Does not match regex ${rex}`);
}

export function parseLiteral<const T extends [Token, string][]>(
  ctx: ParseContext,
  ...match: T
): T[number][1] {
  const remaining = ctx.source.substring(ctx.index);
  for (const [token, m] of match) {
    if (remaining.startsWith(m)) {
      if (m.length > 0) {
        ctx.tokens.push({
          type: token,
          start: ctx.index,
          end: ctx.index + m.length,
        });
      }
      ctx.index += m.length;
      return m;
    }
  }
  throw new Error(`Expected ${match}`);
}
