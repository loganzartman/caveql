import { createRoot } from "react-dom/client";
import { App } from "./App";
import { DataSourceProvider } from "./contexts/DataSourceContext";

// biome-ignore lint/style/noNonNullAssertion: I know what I'm doing
const container = document.getElementById("app")!;
const root = createRoot(container);
root.render(
  <DataSourceProvider>
    <App />
  </DataSourceProvider>
);
