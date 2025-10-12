import type { ParseQueryResult, QueryAST, SortCommandAST } from "caveql";
import { parseQuery, printAST } from "caveql";
import { useCallback, useMemo } from "react";
import type { SortChangeHandler, SortMap } from "./components/ResultsTable";

export function useSortQuery(
  query: string,
  setQuery: (query: string) => void,
): [SortMap, SortChangeHandler] {
  const parseResult = useMemo(() => {
    try {
      return parseQuery(query);
    } catch {
      return null;
    }
  }, [query]);

  const sort = useMemo(
    () => (parseResult ? getQuerySort(parseResult.ast) : {}),
    [parseResult],
  );

  const handleUpdateSort = useCallback<SortChangeHandler>(
    ({ field, direction }) => {
      if (!parseResult) {
        return;
      }

      const newSort = {
        ...sort,
        [field]: direction,
      };
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
