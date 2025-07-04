import * as monaco from "monaco-editor";
import { createDocumentSemanticTokensProvider } from "../src";

monaco.languages.register({ id: "caveql" });
monaco.languages.registerDocumentSemanticTokensProvider(
  "caveql",
  createDocumentSemanticTokensProvider(),
);
monaco.editor.defineTheme("caveql", {
  base: "vs-dark",
  inherit: true,
  colors: {},
  rules: [],
});

export { monaco };
