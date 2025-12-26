import type { QueryAST } from "../parser";
import { AsyncGeneratorFunction } from "./AsyncGeneratorFunction";
import { compileCommand } from "./compileCommand";
import { compileInstrumentInput } from "./compileInstrumentInput";
import { getRuntimeDeps, type InjectedDeps } from "./runtime/runtime";
import "./runtime/threading/mapRecordsWeb";

type InputIterable = Iterable<unknown> | AsyncIterable<unknown>;

export type QueryFunction = ((
  records: InputIterable,
  context?: ExecutionContext,
) => AsyncGenerator<Record<string, unknown>>) & { source: QuerySource };

const querySourceTag: unique symbol = Symbol();
export type QuerySource = string & { [querySourceTag]?: true };

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
export function bindCompiledQuery(source: string): QueryFunction {
  const sourceWithDeps = `
    const {
      ${Object.keys(getRuntimeDeps()).join(", ")}
    } = deps;
    const HW_CONCURRENCY = getHardwareConcurrency();
    
    ${source}
  `;

  const compiledFn = new AsyncGeneratorFunction(
    "deps",
    "records",
    "context",
    sourceWithDeps,
  ) as unknown as (
    deps: InjectedDeps,
    records: InputIterable,
    context: ExecutionContext,
  ) => AsyncGenerator<Record<string, unknown>>;

  const deps = getRuntimeDeps();
  const injectedFn = (records: InputIterable, context?: ExecutionContext) =>
    compiledFn(deps, records, context ?? createExecutionContext());
  injectedFn.source = sourceWithDeps;

  return injectedFn;
}

/**
 * Compile a query AST into a JS function source string.
 *
 * You probably want compileQuery, which produces a callable function tagged
 * with a `source` string.
 */
export function compileQueryRaw(query: QueryAST): QuerySource {
  return `
    let result = (${compileInstrumentInput()})(records, context);

    ${query.pipeline.map((command) => `result = (${compileCommand(command)})(result, context);`).join("\n\n")}

    yield* result;
  ` as QuerySource;
}

export type ExecutionContext = {
  recordsRead: number;
  bytesRead: number;
  bytesTotal: number | null;
};

export function createExecutionContext({
  bytesTotal = null,
}: {
  bytesTotal?: number | null;
} = {}): ExecutionContext {
  return {
    recordsRead: 0,
    bytesRead: 0,
    bytesTotal,
  };
}
