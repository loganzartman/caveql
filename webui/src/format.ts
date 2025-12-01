import type { QueryAST } from "caveql";
import { format as prettierFormat } from "prettier";
import prettierPluginBabel from "prettier/plugins/babel";
import prettierPluginEstree from "prettier/plugins/estree";

export function formatQuerySource(source: string) {
  const wrappedSource = `async function* run(records, context) {${source}}`;
  return prettierFormat(wrappedSource, {
    parser: "babel",
    plugins: [prettierPluginBabel, prettierPluginEstree],
  });
}

export function formatAST(ast: QueryAST) {
  const stringified = JSON.stringify(ast, null, 2);
  return prettierFormat(stringified, {
    parser: "json",
    plugins: [prettierPluginBabel, prettierPluginEstree],
  });
}
