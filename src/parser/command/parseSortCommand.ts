import {
  type NumericAST,
  parseLiteral,
  parseNumeric,
  parseOne,
  parseOptional,
  parseString,
  parseWs,
  type StringAST,
} from "../parseCommon";
import type { ParseContext } from "../types";

export type SortCommandAST = {
  type: "sort";
  count: NumericAST | undefined;
  fields: SortFieldAST[];
};

export type SortFieldAST = {
  type: "sort-field";
  field: StringAST;
  comparator: "auto" | "str" | "ip" | "num" | undefined;
  desc: boolean | undefined;
};

export function parseSortCommand(ctx: ParseContext): SortCommandAST {
  parseWs(ctx);
  parseLiteral(ctx, "sort");

  parseWs(ctx);
  const count = parseOptional(ctx, (c) => parseNumeric(c));

  const fields: SortFieldAST[] = [];
  while (true) {
    try {
      parseWs(ctx);
      fields.push(parseSortField(ctx));
      parseWs(ctx);
      parseLiteral(ctx, ",");
    } catch {
      break;
    }
  }

  return { type: "sort", count, fields };
}

export function parseSortField(ctx: ParseContext): SortFieldAST {
  parseWs(ctx);

  const prefix = parseOptional(ctx, (c) => parseLiteral(c, "+", "-"));
  let desc: boolean | undefined;
  if (prefix === "+") desc = false;
  if (prefix === "-") desc = true;

  parseWs(ctx);
  const { field, comparator } = parseOne(
    ctx,
    // explicit comparator
    (c) => {
      const comparator = parseLiteral(c, "auto", "str", "ip", "num");
      parseWs(c);
      parseLiteral(c, "(");
      parseWs(c);
      const field = parseString(c);
      parseWs(c);
      parseLiteral(c, ")");
      return { field, comparator };
    },
    // bare field (comparator auto)
    (c) => {
      const comparator = undefined;
      const field = parseString(c);
      return { field, comparator };
    },
  );

  return { type: "sort-field", field, comparator, desc };
}
