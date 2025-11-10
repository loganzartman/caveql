import { Token } from "../../tokens";
import type { ParseContext } from "../ParseContext";
import {
  type FieldNameAST,
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
  parseLiteral(ctx, [Token.command, "fields"]);

  const fields: FieldNameAST[] = [];
  let remove: boolean | undefined;

  parseOptional(ctx, (ctx) => {
    parseWs(ctx);

    const plusMinus = parseOptional(ctx, (c) =>
      parseLiteral(c, [Token.operator, "+"], [Token.operator, "-"]),
    );
    if (plusMinus === "-") remove = true;
    if (plusMinus === "+") remove = false;

    parseOptional(ctx, parseWs);

    while (true) {
      try {
        fields.push(parseFieldName(ctx));
        parseOptional(ctx, parseWs);
        parseLiteral(ctx, [Token.comma, ","]);
        parseOptional(ctx, parseWs);
      } catch {
        break;
      }
    }
  });

  return { type: "fields", fields, remove };
}
