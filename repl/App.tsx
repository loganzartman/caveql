import { useState } from "react";
import { formatTree, parseQuery } from "../src";
import { compileQuery } from "../src/compile";

export function App() {
  const [source, setSource] = useState(() => {
    try {
      return atob(window.location.hash.substring(1));
    } catch {
      return "";
    }
  });

  let treeString: string;
  let code: string;
  try {
    const tree = parseQuery(source);
    treeString = formatTree(tree);
    code = compileQuery(tree);
    history.replaceState(undefined, "", `#${btoa(source)}`);
  } catch (e) {
    treeString = `Error: ${e instanceof Error ? e.message : String(e)}`;
    code = treeString;
  }

  return (
    <div className="flex flex-col w-full h-full gap-4 p-4">
      <div className="flex-1/4 grow h-0 flex flex-col gap-2">
        Type query:
        <textarea
          className="w-full h-full font-mono border-2"
          value={source}
          onChange={(e) => setSource(e.target.value)}
        />
      </div>
      <div className="flex-3/4 grow h-0 flex flex-row">
        <div className="grow w-0 flex flex-col gap-2">
          <div>Parse tree:</div>
          <pre>{treeString}</pre>
        </div>
        <div className="grow w-0 flex flex-col gap-2">
          <div>Generated code:</div>
          <pre>{code}</pre>
        </div>
      </div>
    </div>
  );
}
