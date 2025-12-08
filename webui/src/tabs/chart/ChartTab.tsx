import { useAppContext } from "../../AppContext";
import { ChartTypeSelector } from "../../components/ChartTypeSelector";
import { ResultsChart } from "../../components/chart/ResultsChart";

export function ChartTab() {
  const { results, chartType, setChartType } = useAppContext();

  return (
    <div className="flex flex-col h-full p-2">
      <ChartTypeSelector chartType={chartType} onChange={setChartType} />
      <div className="grow">
        {results && <ResultsChart type={chartType} results={results} />}
      </div>
    </div>
  );
}
