import { Token } from "../../tokens";
import type { ParseContext } from "../ParseContext";
import {
  type FieldNameAST,
  parseFieldName,
  parseLiteral,
  parseOne,
  parseParam,
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
  parseWs(ctx);
  parseLiteral(ctx, [Token.command, "rex"]);

  let field: FieldNameAST | undefined;
  let mode: RexMode | undefined;

  while (true) {
    try {
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
    } catch {
      break;
    }
  }

  const regex = parseString(ctx, { token: Token.regex });

  return {
    type: "rex",
    field,
    mode,
    regex,
  };
}
