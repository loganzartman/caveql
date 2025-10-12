import { impossible } from "../../lib/impossible";
import type { VirtualArray } from "../../lib/VirtualArray";
import { ResultsBarChart } from "./ResultsBarChart";
import { ResultsLineChart } from "./ResultsLineChart";

export type ResultsChartType = "bar" | "line";

export function ResultsChart({
  type,
  results,
}: {
  type: ResultsChartType;
  results: VirtualArray<Record<string, unknown>>;
}) {
  if (type === "bar") {
    return <ResultsBarChart results={results} />;
  }
  if (type === "line") {
    return <ResultsLineChart results={results} />;
  }
  impossible(type);
}
