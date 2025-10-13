import { z } from "zod";
import { Token } from "../../tokens";
import type { ParseContext } from "../ParseContext";
import {
  type FieldNameAST,
  fieldNameASTSchema,
  parseFieldName,
  parseLiteral,
  parseOne,
  parseParam,
  parseString,
  parseWs,
  stringASTSchema,
} from "../parseCommon";

export const rexModeSchema = z.enum(["sed"]).optional();
export type RexMode = z.infer<typeof rexModeSchema>;

export const rexCommandASTSchema = z.object({
  type: z.literal("rex"),
  field: fieldNameASTSchema.optional(),
  mode: rexModeSchema,
  regex: stringASTSchema,
});
export type RexCommandAST = z.infer<typeof rexCommandASTSchema>;

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
