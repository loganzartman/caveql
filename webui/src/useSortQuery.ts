import type { ParseQueryResult, QueryAST, SortCommandAST } from "caveql";
import { parseQuery, printAST } from "caveql";
import { useCallback, useEffect, useState } from "react";
import type { SortChangeHandler, SortMap } from "./components/ResultsTable";

export function useSortQuery(
  query: string,
  setQuery: (query: string) => void,
): [SortMap, SortChangeHandler] {
  const [sort, setSort] = useState({});
  const [parseResult, setParseResult] = useState<ParseQueryResult | null>(null);

  useEffect(() => {
    let parseResult: ParseQueryResult;
    try {
      parseResult = parseQuery(query);
    } catch {
      return;
    }

    setParseResult(parseResult);
    setSort(getQuerySort(parseResult.ast));
  }, [query]);

  const handleUpdateSort = useCallback<SortChangeHandler>(
    ({ field, direction }) => {
      if (!parseResult) {
        return;
      }

      const newSort = {
        ...sort,
        [field]: direction,
      };
      setSort(newSort);
      setQuery(updateQuerySort(query, parseResult, newSort));
    },
    [query, setQuery, sort, parseResult],
  );

  return [sort, handleUpdateSort];
}

function getQuerySort(ast: QueryAST): SortMap {
  const lastCommand = ast.pipeline.at(-1);
  if (lastCommand?.type !== "sort") {
    return {};
  }

  const sortMap: SortMap = {};
  for (const field of lastCommand.fields) {
    sortMap[field.field.value] = field.desc ? "desc" : "asc";
  }
  return sortMap;
}

function updateQuerySort(
  query: string,
  parseResult: ParseQueryResult,
  sort: SortMap,
): string {
  const lastCommand = structuredClone(parseResult.ast.pipeline.at(-1));
  if (lastCommand?.type !== "sort") {
    const sortCommand: SortCommandAST = {
      type: "sort",
      count: undefined,
      fields: Object.entries(sort).map(([field, direction]) => ({
        type: "sort-field",
        comparator: undefined,
        field: { type: "field-name", value: field },
        desc: direction === "desc",
      })),
    };
    const sortStr = printAST(sortCommand);
    return `${query}\n| ${sortStr}`;
  }

  for (const [field, direction] of Object.entries(sort)) {
    const existingField = lastCommand.fields.find(
      (f) => f.field.value === field,
    );
    if (existingField) {
      if (direction === "none") {
        lastCommand.fields = lastCommand.fields.filter(
          (f) => f !== existingField,
        );
      } else {
        existingField.desc = direction === "desc";
      }
    } else {
      lastCommand.fields.unshift({
        type: "sort-field",
        comparator: undefined,
        field: { type: "field-name", value: field },
        desc: direction === "desc",
      });
    }
  }

  // TODO: add location info to tokens
  const sortStart =
    [...query.matchAll(/\|[\s\r\n]*sort\b/gm)].at(-1)?.index ?? 0;

  if (!lastCommand.fields.length) {
    return `${query.substring(0, sortStart).trimEnd()}`;
  }
  return `${query.substring(0, sortStart).trimEnd()}\n| ${printAST(lastCommand)}`;
}
