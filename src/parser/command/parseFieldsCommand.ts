import { Token } from "../../tokens";
import {
  parseLiteral,
  parseOptional,
  parseString,
  parseWs,
  type StringAST,
} from "../parseCommon";
import type { ParseContext } from "../types";

export type FieldsCommandAST = {
  type: "fields";
  fields: StringAST[];
  remove?: boolean;
};

export function parseFieldsCommand(ctx: ParseContext): FieldsCommandAST {
  parseWs(ctx);
  parseLiteral(ctx, [Token.command, "fields"]);

  parseWs(ctx);
  let remove: boolean | undefined;
  const plusMinus = parseOptional(ctx, (c) =>
    parseLiteral(c, [Token.operator, "+"], [Token.operator, "-"]),
  );
  if (plusMinus === "-") remove = true;
  if (plusMinus === "+") remove = false;

  const fields = [];
  while (true) {
    try {
      parseWs(ctx);
      fields.push(parseString(ctx));
      parseWs(ctx);
      parseLiteral(ctx, [Token.comma, ","]);
    } catch {
      break;
    }
  }

  return { type: "fields", fields, remove };
}
