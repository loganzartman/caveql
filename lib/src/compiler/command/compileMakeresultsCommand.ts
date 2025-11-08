import { impossible } from "../../impossible";
import type { MakeresultsCommandAST } from "../../parser";

export function compileMakeresultsCommand(
  command: MakeresultsCommandAST,
): string {
  if (command.data) {
    let data: unknown[];
    if (command.format === "json") {
      data = JSON.parse(command.data.value);
    } else if (command.format === "csv") {
      throw new Error("makeresults format=csv not implemented");
    } else {
      impossible(command.format);
    }

    if (!Array.isArray(data)) {
      throw new Error("makeresults data must be an array");
    }

    const items = data.map((item) => {
      if (typeof item !== "object") {
        throw new Error("makeresults data items must be objects");
      }
      return {
        _raw: JSON.stringify(item),
        _time: new Date().toISOString(),
        ...item,
      };
    });

    return `
      async function* makeresultsCommand(records, context) {
        yield* records;
        const items = ${JSON.stringify(items)};
        for (const item of items) {
          context.recordsRead += 1;
          yield item;
        }
      }
    `;
  }

  return `
    async function* makeresultsCommand(records, context) {
      yield* records;
      const _time = new Date().toISOString();
      for (let i = 0; i < ${command.count.value}; ++i) {
        context.recordsRead += 1;
        yield { _time };
      }
    }
  `;
}
