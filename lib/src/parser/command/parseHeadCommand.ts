import { Token } from "../../tokens";
import type { ParseContext } from "../ParseContext";
import {
  type NumericAST,
  parseLiteral,
  parseLiteralBoolean,
  parseNumeric,
  parseOne,
  parseParam,
  parseStar,
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

  parseStar(ctx, (ctx) => {
    parseWs(ctx);
    parseOne(
      ctx,
      (ctx) => {
        params.limit = parseParam(ctx, "limit", (ctx) => parseNumeric(ctx));
      },
      (ctx) => {
        params.allowNull = parseParam(ctx, "null", (ctx) =>
          parseLiteralBoolean(ctx),
        );
      },
      (ctx) => {
        params.keepLast = parseParam(ctx, "keeplast", (ctx) =>
          parseLiteralBoolean(ctx),
        );
      },
    );
  });

  return parseOne(
    ctx,
    (ctx) => {
      parseWs(ctx);
      const expr = parseGroup(ctx);
      return {
        type: "head",
        ...params,
        expr,
      } as const satisfies HeadCommandExprAST;
    },
    (ctx) => {
      parseWs(ctx);
      const n = parseNumeric(ctx);
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
