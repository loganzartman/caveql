import { useAppContext } from "../../AppContext";
import { ResultsTable } from "../../components/ResultsTable";

export function TableTab() {
  const { results, resultsLoading, sort, onSortChange } = useAppContext();

  if (resultsLoading && !results.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <span>Loading results...</span>
      </div>
    );
  }

  return (
    <ResultsTable
      results={results.items}
      fieldSet={results.fieldSet}
      sort={sort}
      onSortChange={onSortChange}
    />
  );
}
