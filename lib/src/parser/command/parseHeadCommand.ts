import { Token } from "../../tokens";
import type { ParseContext } from "../ParseContext";
import {
  type NumericAST,
  parseLiteral,
  parseLiteralBoolean,
  parseNumeric,
  parseOne,
  parseOptional,
  parseParam,
  parseWs,
} from "../parseCommon";
import { type ExpressionAST, parseGroup } from "../parseExpression";

export type HeadCommandBaseAST = {
  type: "head";
  limit: NumericAST | undefined;
  allowNull: boolean | undefined;
  keepLast: boolean | undefined;
};

export type HeadCommandCountAST = HeadCommandBaseAST & {
  n: NumericAST | undefined;
};

export type HeadCommandExprAST = HeadCommandBaseAST & {
  expr: ExpressionAST;
};

export type HeadCommandAST = HeadCommandCountAST | HeadCommandExprAST;

export function parseHeadCommand(ctx: ParseContext): HeadCommandAST {
  parseLiteral(ctx, [Token.command, "head"]);

  const params = {
    limit: undefined as NumericAST | undefined,
    allowNull: undefined as boolean | undefined,
    keepLast: undefined as boolean | undefined,
  };

  while (true) {
    try {
      parseWs(ctx);
      parseOne(
        ctx,
        (c) => {
          params.limit = parseParam(c, "limit", (c) => parseNumeric(c));
        },
        (c) => {
          params.allowNull = parseParam(c, "null", (c) =>
            parseLiteralBoolean(c),
          );
        },
        (c) => {
          params.keepLast = parseParam(c, "keeplast", (c) =>
            parseLiteralBoolean(c),
          );
        },
      );
    } catch {
      break;
    }
  }

  return parseOne(
    ctx,
    (c) => {
      parseWs(ctx);
      const expr = parseGroup(c);
      return {
        type: "head",
        ...params,
        expr,
      } as const satisfies HeadCommandExprAST;
    },
    (c) => {
      parseWs(ctx);
      const n = parseNumeric(c);
      return {
        type: "head",
        ...params,
        n,
      } as const satisfies HeadCommandCountAST;
    },
    () =>
      ({
        type: "head",
        ...params,
        n: undefined,
      }) as const satisfies HeadCommandCountAST,
  );
}
