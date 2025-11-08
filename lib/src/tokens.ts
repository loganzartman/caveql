export enum Token {
  comma,
  command,
  comment,
  field,
  function,
  keyword,
  number,
  operator,
  parameter,
  paren,
  pipe,
  regex,
  string,
  whitespace,
}

export type TokenAST = {
  type: Token;
  start: number;
  end: number;
};
