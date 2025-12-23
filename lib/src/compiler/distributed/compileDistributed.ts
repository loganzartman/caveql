import type { CompileContext } from "../context";

export function compileDistribute({
  context,
  compileThread,
}: {
  context: CompileContext;
  compileThread: (context: CompileContext) => string;
}): string {
  const fnBody = compileThread(context);
  return `
    async function* distribute(records, context) {
      const slices = splitAsyncGenerator(records, ${context.concurrency});
      const fnBody = ${JSON.stringify(fnBody)} ?? (${fnBody});
      const threads = await Promise.all([
        ${Array.from(
          { length: context.concurrency },
          (_, i) => `mapRecords({records: slices[${i}], fnBody})`,
        ).join(",\n")}
      ]);
      yield* joinAsyncGenerators(threads);
    }
  `;
}
