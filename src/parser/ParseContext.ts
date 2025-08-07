import { Token, type TokenAST } from "../tokens";

export type ParseContext = {
  source: string;
  index: number;
  tokens: TokenAST[];
  collectCompletionsAtIndex?: number;
  completions: Completion[];
};

export type Completion = {
  label: string;
  kind: CompletionItemKind;
  insertText: string;
  start: number;
  end?: number;
};

export enum CompletionItemKind {
  Method = 0,
  Function = 1,
  Constructor = 2,
  Field = 3,
  Variable = 4,
  Class = 5,
  Struct = 6,
  Interface = 7,
  Module = 8,
  Property = 9,
  Event = 10,
  Operator = 11,
  Unit = 12,
  Value = 13,
  Constant = 14,
  Enum = 15,
  EnumMember = 16,
  Keyword = 17,
  Text = 18,
  Color = 19,
  File = 20,
  Reference = 21,
  Customcolor = 22,
  Folder = 23,
  TypeParameter = 24,
  User = 25,
  Issue = 26,
  Snippet = 27,
}

export function tokenToCompletionItemKind(token: Token): CompletionItemKind {
  switch (token) {
    case Token.command:
      return CompletionItemKind.Method;
    case Token.function:
      return CompletionItemKind.Function;
    case Token.field:
      return CompletionItemKind.Field;
    case Token.keyword:
      return CompletionItemKind.Keyword;
    case Token.number:
      return CompletionItemKind.Value;
    case Token.parameter:
      return CompletionItemKind.Variable;
    case Token.operator:
    case Token.paren:
    case Token.pipe:
      return CompletionItemKind.Operator;
    case Token.string:
    case Token.regex:
    case Token.whitespace:
      return CompletionItemKind.Text;
    default:
      return CompletionItemKind.Text;
  }
}
