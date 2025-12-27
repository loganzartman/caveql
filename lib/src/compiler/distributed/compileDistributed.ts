import type { CompileContext } from "../context";

export function compileDistribute({
  context,
  compileThread,
}: {
  context: CompileContext;
  compileThread: (context: CompileContext) => string;
}): string {
  const functionExpression = compileThread(context);
  const expression = `yield* (${functionExpression})(records, context)`;
  // we need a string, but we include an unused function definition to make it formattable for debugging
  const expressionWithReadableSource = `${JSON.stringify(expression)} ?? (${expression})`;
  return `
    async function* distribute(records, context) {
      const expression = ${expressionWithReadableSource};
      const threads = await Promise.all(
        splitAsyncGenerator(records, HW_CONCURRENCY).map((slice) =>
          mapRecords({ records: slice, expression }),
        ),
      );
      yield* joinAsyncGenerators(threads);
    }
  `;
}
