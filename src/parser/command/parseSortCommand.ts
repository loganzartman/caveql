import { Token } from "../../tokens";
import type { ParseContext } from "../ParseContext";
import {
  type FieldNameAST,
  type NumericAST,
  parseFieldName,
  parseLiteral,
  parseNumeric,
  parseOne,
  parseOptional,
  parseWs,
} from "../parseCommon";

export type SortCommandAST = {
  type: "sort";
  count: NumericAST | undefined;
  fields: SortFieldAST[];
};

export type SortFieldAST = {
  type: "sort-field";
  field: FieldNameAST;
  comparator: "auto" | "str" | "ip" | "num" | undefined;
  desc: boolean | undefined;
};

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
