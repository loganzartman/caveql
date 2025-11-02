import { Token } from "../../tokens";
import type { ParseContext } from "../ParseContext";
import {
  type NumericAST,
  parseLiteral,
  parseLiteralBoolean,
  parseNumeric,
  parseOne,
  parseParam,
  parseWs,
} from "../parseCommon";
import { type ExpressionAST, parseGroup } from "../parseExpression";

export type HeadCommandBase = {
  type: "head";
  limit: NumericAST | undefined;
  allowNull: boolean | undefined;
  keepLast: boolean | undefined;
};

export type HeadCommandLimitAST = HeadCommandBase & {
  limit: NumericAST;
};

export type HeadCommandExprAST = HeadCommandBase & {
  expr: ExpressionAST;
};

export type HeadCommandAST = HeadCommandLimitAST | HeadCommandExprAST;

export function parseHeadCommand(ctx: ParseContext): HeadCommandAST {
  parseLiteral(ctx, [Token.command, "head"]);
  parseWs(ctx);

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

  parseWs(ctx);

  return parseOne(
    ctx,
    (c) => {
      if (params.limit) {
        throw new Error("limit already specified");
      }
      const limit = parseNumeric(c);
      return {
        type: "head",
        ...params,
        limit,
      } as const;
    },
    (c) => {
      const expr = parseGroup(c);
      return {
        type: "head",
        ...params,
        expr,
      } as const;
    },
  );
}
