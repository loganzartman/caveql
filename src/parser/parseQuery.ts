import type { CommandAST } from "./parseCommand";
import { parsePipeline } from "./parsePipeline";
import type { ParseContext } from "./types";

export type QueryAST = {
  type: "query";
  pipeline: CommandAST[];
};

export function parseQuery(src: string): {
  ast: QueryAST;
  context: ParseContext;
} {
  const ctx = {
    source: src,
    index: 0,
    compareExpr: false,
    tokens: [],
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
