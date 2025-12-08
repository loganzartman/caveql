import { printAST } from "caveql";
import { useAppContext } from "../../AppContext";
import { Editor } from "../../Editor";

export function InspectFormattedTab() {
  const { ast, error } = useAppContext();

  return (
    <Editor
      value={ast ? printAST(ast) : (error ?? "")}
      language="caveql"
      readOnly
    />
  );
}
