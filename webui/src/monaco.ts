import {
  createCompletionItemProvider,
  createDocumentSemanticTokensProvider,
} from "caveql";
import * as monaco from "monaco-editor";

monaco.languages.register({ id: "caveql" });
monaco.languages.registerDocumentSemanticTokensProvider(
  "caveql",
  createDocumentSemanticTokensProvider(),
);
monaco.languages.registerCompletionItemProvider(
  "caveql",
  createCompletionItemProvider(),
);

// monaco does some janky color math in RGB space, so it only accepts RGB hex colors.
monaco.editor.defineTheme("caveql", {
  base: "vs-dark",
  inherit: true,
  colors: {
    "editor.background": "#292524", // stone-800
    "editor.foreground": "#a6a09b", // stone-300
    "editor.selectionBackground": "#57534d", // stone-600
    "editor.selectionForeground": "#f5f5f4", // stone-100
  },
  rules: [
    {
      token: "delimiter",
      foreground: "#a6a09b", // stone-300
    },
    {
      token: "keyword.command",
      foreground: "#ffd230", // amber-300
    },
    {
      token: "keyword",
      foreground: "#a3b3ff", // indigo-300
    },
    {
      token: "parameter",
      foreground: "#fd9a00", // amber-500
    },
    {
      token: "operator",
      foreground: "#a3b3ff", // indigo-300
    },
    {
      token: "operator.pipe",
      foreground: "#fef3c6", // amber-100
    },
    {
      token: "keyword.function",
      foreground: "#f6339a", // pink-500
    },
    {
      token: "regexp",
      foreground: "#f6339a", // pink-500
    },
    {
      token: "variable.other.property",
      foreground: "#ffa2a2", // red-300
    },
    {
      token: "string",
      foreground: "#f5f5f4", // stone-100
    },
    {
      token: "number",
      foreground: "#dab2ff", // purple-300
    },
    {
      token: "comment",
      foreground: "#008236", // green-700
    },
  ],
});

export { monaco };
