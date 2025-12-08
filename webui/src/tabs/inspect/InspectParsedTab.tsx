import { useAppContext } from "../../AppContext";
import { Editor } from "../../Editor";

export function InspectParsedTab() {
  const { astString, error } = useAppContext();

  return (
    <Editor
      value={astString ?? error ?? "loading..."}
      language="json"
      readOnly
    />
  );
}
