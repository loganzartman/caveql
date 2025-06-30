import TinyQueue from "tinyqueue";
import type { CommandAST, QueryAST } from "../parser";
import {
  compareFieldAuto,
  compareFieldNumber,
  compareFieldString,
} from "./command/compileSortCommand";
import { compileCommand } from "./compileCommand";

export type QueryFunction = ((
  records: Iterable<unknown>,
) => Generator<Record<string, unknown>>) & { source: string };

// runtime dependencies required by the compiled function, which should be
// injected as a parameter rather than compiled into the function itself.
type InjectedDeps = {
  compareFieldAuto: typeof compareFieldAuto;
  compareFieldNumber: typeof compareFieldNumber;
  compareFieldString: typeof compareFieldString;
  looseEq: typeof looseEq;
  TinyQueue: typeof TinyQueue;
};

const GeneratorFunction = function* () {}.constructor as {
  new (...args: string[]): GeneratorFunction;
};

export function compileQuery(query: QueryAST): QueryFunction {
  const source = compilePipeline(query.pipeline);

  const compiledFn = new GeneratorFunction(
    "deps",
    "records",
    source,
  ) as unknown as (
    deps: InjectedDeps,
    records: Iterable<unknown>,
  ) => Generator<Record<string, unknown>>;

  const deps = {
    compareFieldAuto,
    compareFieldNumber,
    compareFieldString,
    looseEq,
    TinyQueue,
  };

  const injectedFn = (records: Iterable<unknown>) => compiledFn(deps, records);
  injectedFn.source = source;

  return injectedFn;
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
    const {
      compareFieldAuto,
      compareFieldNumber,
      compareFieldString,
      looseEq,
      TinyQueue,
    } = deps;

    yield* (
      ${result}
    );
  `;
}

function looseEq(a: unknown, b: unknown): boolean {
  if (typeof a === "string") a = a.toLowerCase();
  if (typeof b === "string") b = b.toLowerCase();
  // biome-ignore lint/suspicious/noDoubleEquals: coerce it!
  return a == b;
}
