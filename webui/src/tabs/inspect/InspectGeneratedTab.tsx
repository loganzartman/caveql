import { useAppContext } from "../../AppContext";
import { Editor } from "../../Editor";

export function InspectGeneratedTab() {
  const { compiled, error } = useAppContext();

  return (
    <Editor
      value={compiled ?? error ?? "loading..."}
      language="javascript"
      readOnly
    />
  );
}
