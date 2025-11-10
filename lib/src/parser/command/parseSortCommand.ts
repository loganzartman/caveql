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
  parsePlus,
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
  parseLiteral(ctx, [Token.command, "sort"]);

  const count = parseOptional(ctx, (ctx) => {
    parseWs(ctx);
    return parseNumeric(ctx);
  });

  const fields: SortFieldAST[] = [];
  parseOptional(ctx, (ctx) => {
    parseWs(ctx);
    parsePlus(ctx, (ctx, { first }) => {
      if (!first) {
        parseOptional(ctx, parseWs);
        parseLiteral(ctx, [Token.comma, ","]);
        parseOptional(ctx, parseWs);
      }
      fields.push(parseSortField(ctx));
    });
  });

  return { type: "sort", count, fields };
}

export function parseSortField(ctx: ParseContext): SortFieldAST {
  const prefix = parseOptional(ctx, (c) =>
    parseLiteral(c, [Token.operator, "+"], [Token.operator, "-"]),
  );
  let desc: boolean | undefined;
  if (prefix === "+") desc = false;
  if (prefix === "-") desc = true;

  parseOptional(ctx, parseWs);
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
      parseOptional(c, parseWs);
      parseLiteral(c, [Token.paren, "("]);
      parseOptional(c, parseWs);
      const field = parseFieldName(c);
      parseOptional(c, parseWs);
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
