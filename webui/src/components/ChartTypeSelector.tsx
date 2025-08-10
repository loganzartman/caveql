import { Select } from "@headlessui/react";
import type { ResultsChartType } from "./chart/ResultsChart";

export function ChartTypeSelector({
  chartType,
  onChange,
}: {
  chartType: ResultsChartType;
  onChange: (type: ResultsChartType) => void;
}) {
  return (
    <div className="shrink-0 flex flex-row gap-2 items-center">
      <Select
        value={chartType}
        onChange={(event) => onChange(event.target.value as ResultsChartType)}
      >
        <option value="bar">Bar Chart</option>
        <option value="line">Line Chart</option>
      </Select>
    </div>
  );
}
