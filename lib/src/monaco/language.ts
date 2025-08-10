import type * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { hasOwn } from "../hasOwn";
import { parseQuery } from "../parser";
import { getSourceIndex, getSourcePosition } from "../parser/sourcePosition";
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
  [Token.regex]: "regexp",
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

      let lastLine = 1;
      let lastCol = 1;
      const data = [];
      for (const token of tokens) {
        if (token.type === Token.whitespace) {
          continue;
        }

        const loc = getSourcePosition({ source, index: token.start });
        const deltaLine = loc.line - lastLine;
        const deltaCol = deltaLine > 0 ? loc.column - 1 : loc.column - lastCol;
        const length = token.end - token.start;

        data.push(
          deltaLine,
          deltaCol,
          length,
          token.type,
          0, // modifier
        );

        lastLine = loc.line;
        lastCol = loc.column;
      }
      return { data: new Uint32Array(data) };
    },
    releaseDocumentSemanticTokens() {},
  };
}

export function createCompletionItemProvider(): monaco.languages.CompletionItemProvider {
  return {
    provideCompletionItems(model, position) {
      const source = model.getValue();
      const result = parseQuery(source, {
        collectCompletionsAtIndex: getSourceIndex({
          source,
          line: position.lineNumber,
          column: position.column,
        }),
      });

      const suggested = new Set<string>();
      const suggestions: monaco.languages.CompletionItem[] =
        result.context.completions
          .map((completion) => {
            const key = `${completion.label}:${completion.kind}`;
            if (suggested.has(key)) {
              return null;
            }
            suggested.add(key);

            const locStart = getSourcePosition({
              source,
              index: completion.start,
            });

            const locEnd = completion.end
              ? getSourcePosition({ source, index: completion.end })
              : locStart;

            return {
              ...completion,
              range: {
                startColumn: locStart.column,
                startLineNumber: locStart.line,
                endColumn: locEnd.column,
                endLineNumber: locEnd.line,
              },
            };
          })
          .filter((x) => !!x);

      return {
        suggestions,
      };
    },
  };
}
