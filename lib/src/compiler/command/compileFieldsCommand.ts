import type { FieldsCommandAST } from "../../parser/command/parseFieldsCommand";
import { compilePathGet, compilePathSet } from "../utils";

export function compileFieldsCommand(command: FieldsCommandAST): string {
  if (command.remove) {
    return `
      async function* fieldsCommand(records) {
        for await (const record of records) {
          const newRecord = structuredClone(record);
          ${command.fields.map((field) => `delete ${compilePathGet("newRecord", field.value)};`).join("\n")}
          yield newRecord;
        }
      }
    `;
  }

  return `
    async function* fieldsCommand(records) {
      for await (const record of records) {
        const newRecord = {};
        ${command.fields.map((field) => `${compilePathSet("newRecord", field.value, compilePathGet("record", field.value))}`).join("\n")}
        yield newRecord;
      }
    }
  `;
}
