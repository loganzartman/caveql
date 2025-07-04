import type { TokenAST } from "../tokens";

export type ParseContext = {
  source: string;
  index: number;
  compareExpr: boolean;
  tokens: TokenAST[];
};
