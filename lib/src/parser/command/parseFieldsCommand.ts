import { Token } from "../../tokens";
import type { ParseContext } from "../ParseContext";
import type { FieldNameAST } from "../parseCommon";
import {
  parseFieldName,
  parseLiteral,
  parseOptional,
  parseWs,
} from "../parseCommon";

export type FieldsCommandAST = {
  type: "fields";
  fields: FieldNameAST[];
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
      fields.push(parseFieldName(ctx));
      parseWs(ctx);
      parseLiteral(ctx, [Token.comma, ","]);
    } catch {
      break;
    }
  }

  return { type: "fields", fields, remove };
}
