import { z } from "zod";
import type { ParseContext } from "./ParseContext";
import { commandASTSchema } from "./parseCommand";
import { parsePipeline } from "./parsePipeline";

export const queryASTSchema = z.object({
  type: z.literal("query"),
  pipeline: z.array(commandASTSchema),
});
export type QueryAST = z.infer<typeof queryASTSchema>;

export const parseQueryResultSchema = z.object({
  ast: queryASTSchema,
  context: z.custom<ParseContext>(),
});
export type ParseQueryResult = z.infer<typeof parseQueryResultSchema>;

export function parseQuery(
  src: string,
  context?: Partial<Omit<ParseContext, "source">>,
): ParseQueryResult {
  const ctx = {
    source: src,
    index: 0,
    tokens: [],

    completions: [],
    definedFieldNames: new Set(),

    ...context,
  } satisfies ParseContext;

  return {
    ast: parseQuery_(ctx),
    context: ctx,
  };
}

function parseQuery_(ctx: ParseContext): QueryAST {
  const pipeline = parsePipeline(ctx);

  return {
    type: "query",
    pipeline,
  };
}
