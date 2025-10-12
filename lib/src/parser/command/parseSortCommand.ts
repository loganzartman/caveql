import { z } from "zod";
import { Token } from "../../tokens";
import type { ParseContext } from "../ParseContext";
import {
  fieldNameASTSchema,
  numericASTSchema,
  parseFieldName,
  parseLiteral,
  parseNumeric,
  parseOne,
  parseOptional,
  parseWs,
} from "../parseCommon";

export const sortFieldASTSchema = z.object({
  type: z.literal("sort-field"),
  field: fieldNameASTSchema,
  comparator: z.enum(["auto", "str", "ip", "num"]).optional(),
  desc: z.boolean().optional(),
});
export type SortFieldAST = z.infer<typeof sortFieldASTSchema>;

export const sortCommandASTSchema = z.object({
  type: z.literal("sort"),
  count: numericASTSchema.optional(),
  fields: z.array(sortFieldASTSchema),
});
export type SortCommandAST = z.infer<typeof sortCommandASTSchema>;

export function parseSortCommand(ctx: ParseContext): SortCommandAST {
  parseWs(ctx);
  parseLiteral(ctx, [Token.command, "sort"]);

  parseWs(ctx);
  const count = parseOptional(ctx, (c) => parseNumeric(c));

  const fields: SortFieldAST[] = [];
  while (true) {
    try {
      parseWs(ctx);
      fields.push(parseSortField(ctx));
      parseWs(ctx);
      parseLiteral(ctx, [Token.comma, ","]);
    } catch {
      break;
    }
  }

  return { type: "sort", count, fields };
}

export function parseSortField(ctx: ParseContext): SortFieldAST {
  parseWs(ctx);

  const prefix = parseOptional(ctx, (c) =>
    parseLiteral(c, [Token.operator, "+"], [Token.operator, "-"]),
  );
  let desc: boolean | undefined;
  if (prefix === "+") desc = false;
  if (prefix === "-") desc = true;

  parseWs(ctx);
  const { field, comparator } = parseOne(
    ctx,
    // explicit comparator
    (c) => {
      const comparator = parseLiteral(
        c,
        [Token.function, "auto"],
        [Token.function, "str"],
        [Token.function, "ip"],
        [Token.function, "num"],
      );
      parseWs(c);
      parseLiteral(c, [Token.paren, "("]);
      parseWs(c);
      const field = parseFieldName(c);
      parseWs(c);
      parseLiteral(c, [Token.paren, ")"]);
      return { field, comparator };
    },
    // bare field (comparator auto)
    (c) => {
      const comparator = undefined;
      const field = parseFieldName(c);
      return { field, comparator };
    },
  );

  return { type: "sort-field", field, comparator, desc };
}
