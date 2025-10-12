import { Button, Transition } from "@headlessui/react";
import {
  ChevronDownIcon,
  ChevronUpDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/20/solid";
import { useVirtualizer } from "@tanstack/react-virtual";
import clsx from "clsx";
import { useMemo, useRef } from "react";
import { impossible } from "../lib/impossible";
import { useColumns } from "../lib/useColumns";
import { ValView } from "./ValView";

export type SortDirection = "asc" | "desc" | "none";
export type SortMap = Record<string, SortDirection>;
export type SortChangeHandler = (params: {
  field: string;
  direction: SortDirection;
}) => void;

export function ResultsTable({
  results,
  fieldSet,
  sort,
  onSortChange,
}: {
  results: ReadonlyArray<Record<string, unknown>>;
  fieldSet: ReadonlySet<string>;
  sort?: SortMap;
  onSortChange?: SortChangeHandler;
}) {
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: results.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 32, // initial estimate
    overscan: 10,
    measureElement: (element) => element?.getBoundingClientRect().height,
  });

  const columns = useColumns({
    columns: fieldSet,
    padding: 32,
    minWidth: 100,
    maxWidth: 800,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  const paddingTop = virtualRows.length > 0 ? virtualRows[0]?.start || 0 : 0;
  const paddingBottom =
    virtualRows.length > 0
      ? totalSize - (virtualRows[virtualRows.length - 1]?.end || 0)
      : 0;

  const headerElems = useMemo(
    () =>
      columns.map(({ id, width, resizeHandleProps, measured }) => {
        const currentDirection = sort?.[id] ?? "none";
        return (
          <th
            key={id}
            className="relative shrink-0 overflow-hidden"
            style={{ width }}
          >
            <Button
              className="pl-1 pr-3 py-1 cursor-pointer text-left w-full truncate"
              onClick={() => {
                const newDirection = nextSortDirection(currentDirection);
                onSortChange?.({
                  field: id,
                  direction: newDirection,
                });
              }}
            >
              {measured(
                -1,
                <div className="flex flex-row gap-1 items-center">
                  <SortIcon direction={currentDirection} />
                  <span className="truncate text-sm">{id}</span>
                </div>,
              )}
            </Button>
            <div
              {...resizeHandleProps}
              role="button"
              tabIndex={0}
              className={clsx(
                "absolute right-0 top-0 h-full w-1.5 cursor-col-resize select-none bg-red-300/20 hover:bg-red-300/50",
              )}
            />
          </th>
        );
      }),
    [sort, onSortChange, columns],
  );

  if (results.length === 0) {
    return (
      <div className="grow-1 shrink-1 basis-0 relative overflow-auto flex items-center justify-center">
        <div>No results.</div>
      </div>
    );
  }

  return (
    <div
      ref={tableContainerRef}
      className="grow-1 shrink-1 basis-0 relative overflow-auto"
    >
      <div className="min-w-full inline-block">
        <table className="w-full block">
          <thead
            className="flex flex-row text-red-300 font-mono font-bold sticky top-0 z-20"
            style={{
              background:
                "color-mix(in srgb, var(--color-red-500), var(--color-stone-800) 90%)",
            }}
          >
            <tr className="flex flex-row">{headerElems}</tr>
          </thead>
          <tbody className="flex flex-col">
            {paddingTop > 0 && (
              <tr>
                <td style={{ height: `${paddingTop}px` }} />
              </tr>
            )}
            {virtualRows.map((virtualRow) => {
              const row = results[virtualRow.index];
              return (
                <Transition
                  key={virtualRow.key}
                  show
                  appear
                  enter="transition-opacity duration-200"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                >
                  <tr
                    ref={rowVirtualizer.measureElement}
                    data-index={virtualRow.index}
                    className={clsx(
                      "w-full flex flex-row hover:outline-1 hover:outline-amber-500 -outline-offset-1 hover:z-10 relative",
                      virtualRow.index % 2 === 0 && "bg-stone-950/30",
                    )}
                  >
                    {columns.map(({ id, width, measured }) => (
                      <td
                        key={id}
                        className="px-3 py-1 transition-colors hover:transition-none hover:bg-amber-400/10 break-all"
                        style={{ width }}
                      >
                        {measured(virtualRow.index, <ValView val={row[id]} />)}
                      </td>
                    ))}
                  </tr>
                </Transition>
              );
            })}
            {paddingBottom > 0 && (
              <tr>
                <td style={{ height: `${paddingBottom}px` }} />
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SortIcon({ direction }: { direction?: SortDirection }) {
  if (direction === "asc") {
    return <ChevronUpIcon className="shrink-0 w-[1em]" />;
  }
  if (direction === "desc") {
    return <ChevronDownIcon className="shrink-0 w-[1em]" />;
  }
  if (direction === "none" || direction === undefined) {
    return <ChevronUpDownIcon className="shrink-0 w-[1em] opacity-50" />;
  }
  impossible(direction);
}

function nextSortDirection(current: SortDirection): SortDirection {
  switch (current) {
    case "none":
      return "asc";
    case "asc":
      return "desc";
    case "desc":
      return "none";
    default:
      impossible(current);
  }
}
