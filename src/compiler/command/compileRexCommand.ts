import type { RexCommandAST } from "../../parser/command/parseRexCommand";
import { compilePathGet } from "../utils";

export function compileRexCommand(command: RexCommandAST): string {
  const field = command.field?.value ?? "_raw";

  return `
    function* rexCommand(records) {
      const regex = new RegExp(${JSON.stringify(command.regex.value)});
      for (const record of records) {
        const value = ${compilePathGet("record", field)};
        if (typeof value !== "string") {
          continue;
        }
        
        const result = regex.exec(value);
        if (!result?.groups) {
          yield record;
          continue;
        }
        
        yield {
          ...record,
          ...result.groups,
        };
      }
    }
  `;
}
