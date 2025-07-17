import { Token } from "../tokens";
import type { ParseContext } from "./ParseContext";

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

export type StringAST = { type: "string"; value: string };

export function parseString(
  ctx: ParseContext,
  { token = Token.string }: { token?: Token } = {},
): StringAST {
  return parseOne(
    ctx,
    (c) =>
      ({
        type: "string",
        value: parseRex(c, token, /"((?:[^\\"]|\\.)*)"/, 1),
      }) as const,
    (c) =>
      ({
        type: "string",
        value: parseRex(c, token, /'((?:[^\\']|\\.)*)'/, 1),
      }) as const,
  );
}

export type FieldNameAST = {
  type: "field-name";
  value: string;
};

export function parseFieldName(ctx: ParseContext): FieldNameAST {
  return parseOne(
    ctx,
    (c) => {
      const str = parseString(c, { token: Token.field });
      return {
        type: "field-name",
        value: str.value,
      } as const;
    },
    parseBareFieldName,
  );
}

export function parseBareFieldName(ctx: ParseContext): FieldNameAST {
  const re = /[\p{L}\p{N}\-$_.]/u;

  let depth = 0;
  let end = ctx.index;

  while (end < ctx.source.length) {
    const c = ctx.source[end];

    if (c === "(") {
      ++depth;
      ++end;
      continue;
    }

    if (c === ")") {
      if (depth === 0) {
        break;
      }
      --depth;
      ++end;
      continue;
    }

    if (re.test(c)) {
      ++end;
      continue;
    }

    break;
  }

  if (depth > 0) {
    throw new Error("Unclosed parentheses in field name");
  }

  if (end === ctx.index) {
    throw new Error("Expected field name");
  }

  const value = ctx.source.substring(ctx.index, end);
  ctx.tokens.push({
    type: Token.field,
    start: ctx.index,
    end,
  });
  ctx.index = end;

  return {
    type: "field-name",
    value,
  };
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
