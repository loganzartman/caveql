import type { QueryAST } from "../parser";
import { compileCommand } from "./compileCommand";
import { compileInstrumentInput } from "./compileInstrumentInput";
import { getRuntimeDeps, type InjectedDeps } from "./runtime";

export type QueryFunction = ((
  records: Iterable<unknown>,
  context?: ExecutionContext,
) => Generator<Record<string, unknown>>) & { source: QuerySource };

const querySourceTag: unique symbol = Symbol();
export type QuerySource = string & { [querySourceTag]?: true };

const GeneratorFunction = function* () {}.constructor as {
  new (...args: string[]): GeneratorFunction;
};

/**
 * Compile a query AST into a generator function that processes records.
 * This is a simple way to execute a query in the current thread.
 */
export function compileQuery(query: QueryAST): QueryFunction {
  return bindCompiledQuery(compileQueryRaw(query));
}

/**
 * Convert a query source string into a generator function that processes
 * records. Bind necessary dependencies to the function.
 *
 * You probably want compileQuery, which does this in one step.
 */
export function bindCompiledQuery(source: QuerySource): QueryFunction {
  const compiledFn = new GeneratorFunction(
    "deps",
    "records",
    "context",
    source,
  ) as unknown as (
    deps: InjectedDeps,
    records: Iterable<unknown>,
    context: ExecutionContext,
  ) => Generator<Record<string, unknown>>;

  const deps = getRuntimeDeps();
  const injectedFn = (records: Iterable<unknown>, context?: ExecutionContext) =>
    compiledFn(deps, records, context ?? createExecutionContext());
  injectedFn.source = source;

  return injectedFn;
}

/**
 * Compile a query AST into a JS function source string.
 *
 * You probably want compileQuery, which produces a callable function tagged
 * with a `source` string.
 */
export function compileQueryRaw(query: QueryAST): QuerySource {
  let result = "records";
  result = `(${compileInstrumentInput()})(${result}, context)`;
  for (const command of query.pipeline) {
    result = `
      (
        ${compileCommand(command)}
      )(
        ${result},
        context,
      )
    `;
  }
  return `
    const {
      ${Object.keys(getRuntimeDeps()).join(", ")}
    } = deps;

    yield* (
      ${result}
    );
  ` as QuerySource;
}

export type ExecutionContext = {
  recordsRead: number;
};

export function createExecutionContext(): ExecutionContext {
  return {
    recordsRead: 0,
  };
}
