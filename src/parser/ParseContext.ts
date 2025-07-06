import type { TokenAST } from "../tokens";

export type ParseContext = {
  source: string;
  index: number;
  tokens: TokenAST[];
};
