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

export type HeadCommandAST = {
  type: "head";
  allowNull: boolean | undefined;
  keepLast: boolean | undefined;
} & (
  | {
      limit: NumericAST;
    }
  | {
      expr: ExpressionAST;
    }
);

export function parseHeadCommand(ctx: ParseContext): HeadCommandAST {
  parseLiteral(ctx, [Token.command, "head"]);
  parseWs(ctx);

  const params = {
    allowNull: undefined as boolean | undefined,
    keepLast: undefined as boolean | undefined,
  };

  while (true) {
    parseWs(ctx);

    try {
      params.allowNull = parseParam(ctx, "null", (c) => parseLiteralBoolean(c));
      continue;
    } catch {}

    try {
      params.keepLast = parseParam(ctx, "keeplast", (c) =>
        parseLiteralBoolean(c),
      );
      continue;
    } catch {}

    break;
  }

  parseWs(ctx);

  return parseOne(
    ctx,
    (c) => {
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
