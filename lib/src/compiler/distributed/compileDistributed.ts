import type { CompileContext } from "../context";

export function compileDistribute({
  context,
  compileThread,
}: {
  context: CompileContext;
  compileThread: (context: CompileContext) => string;
}): string {
  const functionExpression = compileThread(context);
  // we need a string, but we include an unused function definition to make it formattable for debugging
  const functionExpressionWithReadableSource = `${JSON.stringify(functionExpression)} ?? (${functionExpression})`;
  return `
    async function* distribute(records, context) {
      const slices = splitAsyncGenerator(records, HW_CONCURRENCY);
      const functionExpression = ${functionExpressionWithReadableSource};
      const threads = await Promise.all(
        Array.from(
          { length: HW_CONCURRENCY },
          (_, i) => mapRecords({records: slices[i], functionExpression})
        ),
      );
      yield* joinAsyncGenerators(threads);
    }
  `;
}
