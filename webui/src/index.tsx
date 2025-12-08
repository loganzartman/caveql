import { createRoot } from "react-dom/client";
import { App } from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { createBrowserRouter, data, Navigate, RouterProvider } from "./router";
import { ChartTab } from "./tabs/chart/ChartTab";
import { GenerateTab } from "./tabs/generate/GenerateTab";
import { InspectFormattedTab } from "./tabs/inspect/InspectFormattedTab";
import { InspectGeneratedTab } from "./tabs/inspect/InspectGeneratedTab";
import { InspectParsedTab } from "./tabs/inspect/InspectParsedTab";
import { InspectTab } from "./tabs/inspect/InspectTab";
import { TableTab } from "./tabs/table/TableTab";

const router = createBrowserRouter([
  {
    Component: App,
    children: [
      {
        ErrorBoundary,
        children: [
          {
            index: true,
            element: <Navigate to="/table" replace />,
          },
          {
            path: "table",
            Component: TableTab,
          },
          {
            path: "chart",
            Component: ChartTab,
          },
          {
            path: "inspect",
            Component: InspectTab,
            children: [
              {
                index: true,
                element: <Navigate to="parsed" replace />,
              },
              {
                path: "parsed",
                Component: InspectParsedTab,
              },
              {
                path: "generated",
                Component: InspectGeneratedTab,
              },
              {
                path: "formatted",
                Component: InspectFormattedTab,
              },
            ],
          },
          {
            path: "generate",
            Component: GenerateTab,
          },
          {
            path: "*",
            loader: () => {
              throw data(null, { status: 404 });
            },
          },
        ],
      },
    ],
  },
]);

// biome-ignore lint/style/noNonNullAssertion: I know what I'm doing
const container = document.getElementById("app")!;
const root = createRoot(container);
root.render(<RouterProvider router={router} />);
