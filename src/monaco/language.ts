import type * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { hasOwn } from "../hasOwn";
import { parseQuery } from "../parser";
import { getSourceLocation } from "../parser/getSourceLocation";
import { Token } from "../tokens";

const tokenMapping: Record<Token, string> = {
  [Token.comma]: "delimiter.comma",
  [Token.command]: "keyword.command",
  [Token.field]: "variable.other.property",
  [Token.function]: "keyword.function",
  [Token.keyword]: "keyword",
  [Token.number]: "number",
  [Token.operator]: "operator",
  [Token.parameter]: "parameter",
  [Token.paren]: "delimiter.parenthesis",
  [Token.pipe]: "operator.pipe",
  [Token.string]: "string",
  [Token.whitespace]: "whitespace",
} as const;

const legend = {
  tokenTypes: Object.keys(Token).map((k) =>
    hasOwn(tokenMapping, k) ? tokenMapping[k] : k,
  ),
  tokenModifiers: [],
};

/**
 * Create a semantic tokens provider for caveql.
 *
 * How to use:
 *
 * ```ts
 * monaco.languages.register({ id: 'caveql' });
 * monaco.languages.registerDocumentSemanticTokensProvider(
 *  'caveql', createDocumentSemanticTokensProvider(),
 * )
 *
 * ...
 *
 * monaco.editor.create(... ,{
 *   "semanticHighlighting.enabled": true,
 *   ...
 * });
 * ```
 */
export function createDocumentSemanticTokensProvider(): monaco.languages.DocumentSemanticTokensProvider {
  return {
    getLegend() {
      return legend;
    },
    provideDocumentSemanticTokens(model) {
      const source = model.getValue();
      const result = parseQuery(source);
      const tokens = result.context.tokens;

      let lastLine = 0;
      let lastChar = 0;
      const data = [];
      for (const token of tokens) {
        if (token.type === Token.whitespace) {
          continue;
        }

        const loc = getSourceLocation({ source, offset: token.start });
        const deltaLine = loc.line - lastLine;
        const deltaCol = deltaLine > 0 ? loc.column : loc.column - lastChar;
        const length = token.end - token.start;

        data.push(
          deltaLine,
          deltaCol,
          length,
          token.type,
          0, // modifier
        );

        lastLine = loc.line;
        lastChar = loc.column;
      }
      return { data: new Uint32Array(data) };
    },
    releaseDocumentSemanticTokens() {},
  };
}
