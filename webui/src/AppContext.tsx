import type { QueryAST } from "caveql";
import { createContext, useContext } from "react";
import type { SortChangeHandler, SortMap } from "./components/ResultsTable";
import type { VirtualArray } from "./lib/VirtualArray";

export type ResultsChartType = "bar" | "line";

export interface AppContextValue {
  results: VirtualArray<Record<string, unknown>>;
  resultsLoading: boolean;

  sort: SortMap;
  onSortChange: SortChangeHandler;

  chartType: ResultsChartType;
  setChartType: (type: ResultsChartType) => void;

  // ast/compiled state for inspect tab
  ast: QueryAST | null;
  astString: string | null;
  compiled: string | null;
  error: string | null;

  onAcceptQuery: (query: string) => void;
}

export const AppContext = createContext<AppContextValue | null>(null);

export function useAppContext(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppContext.Provider");
  }
  return context;
}
