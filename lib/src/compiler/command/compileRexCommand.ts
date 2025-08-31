import type { RexCommandAST } from "../../parser/command/parseRexCommand";
import { compilePathGet, compilePathSet } from "../utils";

// :chefs-kiss:
const sedRegex =
  /(?<op>^\w)(?<delim>[/|#])(?<a>(?:\\\2|(?!\2).)*)\2(?<b>(?:\\\2|(?!\2).)*)\2(?<flags>\w*)/;

export function compileRexCommand(command: RexCommandAST): string {
  const field = command.field?.value ?? "_raw";

  if (command.mode === "sed") {
    const sedParsed = sedRegex.exec(command.regex.value);
    if (!sedParsed?.groups) {
      throw new Error(
        `Invalid sed expression in rex command: ${command.regex.value}`,
      );
    }

    const { op, delim, a: rawA, b: rawB, flags } = sedParsed.groups;
    const a = rawA.replaceAll(`\\${delim}`, delim);
    const b = rawB.replaceAll(`\\${delim}`, delim);

    if (op === "s") {
      return `
        async function* rexCommand(records) {
          const needle = new RegExp(${JSON.stringify(a)}, ${JSON.stringify(flags)});
          const replacement = ${JSON.stringify(b)};

          for await (const record of records) {
            const value = ${compilePathGet("record", field)};
            if (typeof value !== "string") {
              yield record;
              continue;
            }
            
            const newRecord = structuredClone(record);
            ${compilePathSet("newRecord", field, `value.replace(needle, replacement)`)};
            yield newRecord;
          }
        }
      `;
    }

    throw new Error(
      `Unsupported rex sed operation: ${op} in ${command.regex.value}`,
    );
  }

  return `
    async function* rexCommand(records) {
      const regex = new RegExp(${JSON.stringify(command.regex.value)});
      for await (const record of records) {
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
