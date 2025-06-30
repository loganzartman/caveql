import type { CommandAST, QueryAST } from "../parser";
import { impossible } from "../impossible";
import { compileSearchCommand } from "./command/compileSearchCommand";
import { compileEvalCommand } from "./command/compileEvalCommand";
import { compileMakeresultsCommand } from "./command/compileMakeresultsCommand";
import { compileWhereCommand } from "./command/compileWhereCommand";
import { compileStatsCommand } from "./command/compileStatsCommand";
import { compileStreamstatsCommand } from "./command/compileStreamstatsCommand";

export type QueryFunction = ((
  records: Iterable<unknown>,
) => Generator<Record<string, unknown>>) & { source: string };

const GeneratorFunction = function* () {}.constructor as {
  new (...args: string[]): GeneratorFunction;
};

export function compileQuery(query: QueryAST): QueryFunction {
  const source = compilePipeline(query.pipeline);
  const fn = new GeneratorFunction(
    "records",
    source,
  ) as unknown as QueryFunction;
  fn.source = source;
  return fn;
}

function compilePipeline(pipeline: CommandAST[]): string {
  let result = "records";
  for (const command of pipeline) {
    result = `
			(
				${compileCommand(command)}
			)(
				${result}
			)
    `;
  }
  return `
		function looseEq(a, b) {
		  if (typeof a === 'string') a = a.toLowerCase();
			if (typeof b === 'string') b = b.toLowerCase();
			return a == b;
		}

		yield* (
			${result}
		);
	`;
}

function compileCommand(command: CommandAST): string {
  switch (command.type) {
    case "search":
      return compileSearchCommand(command);
    case "eval":
      return compileEvalCommand(command);
    case "makeresults":
      return compileMakeresultsCommand(command);
    case "where":
      return compileWhereCommand(command);
    case "stats":
      return compileStatsCommand(command);
    case "streamstats":
      return compileStreamstatsCommand(command);
    default:
      impossible(command);
  }
}
