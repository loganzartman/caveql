export enum Token {
  comma,
  command,
  field,
  function,
  number,
  operator,
  parameter,
  paren,
  pipe,
  string,
  whitespace,
}

export type TokenAST = {
  type: Token;
  start: number;
  end: number;
};
