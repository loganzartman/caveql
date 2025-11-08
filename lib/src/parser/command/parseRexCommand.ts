import { Token } from "../../tokens";
import type { ParseContext } from "../ParseContext";
import {
  type FieldNameAST,
  parseFieldName,
  parseLiteral,
  parseOne,
  parseParam,
  parseStar,
  parseString,
  parseWs,
  type StringAST,
} from "../parseCommon";

export type RexMode = "sed" | undefined;

export type RexCommandAST = {
  type: "rex";
  field: FieldNameAST | undefined;
  mode: RexMode;
  regex: StringAST;
};

export function parseRexCommand(ctx: ParseContext): RexCommandAST {
  parseLiteral(ctx, [Token.command, "rex"]);

  let field: FieldNameAST | undefined;
  let mode: RexMode | undefined;

  parseStar(ctx, (ctx) => {
    parseWs(ctx);
    parseOne(
      ctx,
      (c) => {
        field = parseParam(c, "field", parseFieldName);
      },
      (c) => {
        mode = parseParam(c, "mode", (c) =>
          parseLiteral(c, [Token.string, "sed"]),
        );
      },
    );
  });

  const regex = parseString(ctx, { token: Token.regex });

  return {
    type: "rex",
    field,
    mode,
    regex,
  };
}
