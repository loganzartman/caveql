import { Button } from "@headlessui/react";
import {
  ChevronDownIcon,
  ChevronUpDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/20/solid";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import clsx from "clsx";
import { useEffect, useMemo, useRef } from "react";
import { impossible } from "../impossible";
import type { VirtualArray } from "../VirtualArray";
import { ValView } from "./ValView";

export type SortDirection = "asc" | "desc" | "none";
export type SortMap = Record<string, SortDirection>;
export type SortChangeHandler = (params: {
  field: string;
  direction: SortDirection;
}) => void;

export function ResultsTable({
  results,
  sort,
  onSortChange,
}: {
  results: VirtualArray<Record<string, unknown>>;
  sort?: SortMap;
  onSortChange?: SortChangeHandler;
}) {
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Convert results to array for TanStack Table
  const data = useMemo(() => {
    const arr = [];
    for (let i = 0; i < results.length; i++) {
      const row = results.at(i);
      if (row) arr.push(row);
    }
    return arr;
  }, [results]);

  const cols = useMemo(() => Array.from(results.fieldSet), [results]);

  // Simple column width estimation based on header length
  const columnWidthHints = useMemo(() => {
    const hints: Record<string, number> = {};
    cols.forEach((col) => {
      // Base width on column name length, with sensible defaults
      const baseWidth = col.length * 10;
      hints[col] = Math.min(300, Math.max(100, baseWidth));
    });
    return hints;
  }, [cols]);

  // Create columns definition for TanStack Table
  const columns = useMemo<ColumnDef<Record<string, unknown>>[]>(
    () =>
      cols.map((col) => ({
        id: col,
        accessorFn: (row) => row[col],
        header: col,
        cell: (info) => <ValView val={info.getValue()} />,
        size: columnWidthHints[col], // Suggested size based on content
        minSize: 60, // Minimum column width
        maxSize: 500, // Maximum column width
      })),
    [cols, columnWidthHints],
  );

  // Convert sort to TanStack Table sorting state
  const sorting = useMemo<SortingState>(() => {
    if (!sort) return [];
    return Object.entries(sort)
      .filter(([_, dir]) => dir !== "none")
      .map(([id, dir]) => ({
        id,
        desc: dir === "desc",
      }));
  }, [sort]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: (updaterOrValue) => {
      if (!onSortChange) return;
      const newSorting =
        typeof updaterOrValue === "function"
          ? updaterOrValue(sorting)
          : updaterOrValue;

      // Convert back to our sort format
      if (newSorting.length === 0) {
        // Clear all sorts
        cols.forEach((col) => {
          if (sort?.[col] && sort[col] !== "none") {
            onSortChange({ field: col, direction: "none" });
          }
        });
      } else {
        const sortItem = newSorting[0];
        if (sortItem) {
          onSortChange({
            field: sortItem.id,
            direction: sortItem.desc ? "desc" : "asc",
          });
        }
      }
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualSorting: true, // We're handling sorting externally
    columnResizeMode: "onChange",
    enableColumnResizing: true, // Allow users to resize columns
  });

  const { rows } = table.getRowModel();

  // Setup virtualizer with dynamic row heights
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 35, // Initial estimate
    overscan: 10,
    measureElement:
      typeof window !== "undefined" &&
      navigator.userAgent.indexOf("Firefox") === -1
        ? (element) => element?.getBoundingClientRect().height
        : undefined,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  const paddingTop = virtualRows.length > 0 ? virtualRows[0]?.start || 0 : 0;
  const paddingBottom =
    virtualRows.length > 0
      ? totalSize - (virtualRows[virtualRows.length - 1]?.end || 0)
      : 0;

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
        <table className="w-full table-fixed">
          <thead
            className="text-red-300 font-mono font-bold sticky top-0 z-20"
            style={{
              background:
                "color-mix(in srgb, var(--color-red-500), var(--color-stone-800) 90%)",
            }}
          >
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const currentDirection = sort?.[header.id] ?? "none";
                  return (
                    <th
                      key={header.id}
                      className="relative"
                      style={{
                        width: header.getSize(),
                        minWidth: header.column.columnDef.minSize,
                        maxWidth: header.column.columnDef.maxSize,
                      }}
                    >
                      <Button
                        className="px-3 py-1 cursor-pointer text-left w-full truncate"
                        title={header.id}
                        onClick={() => {
                          const newDirection =
                            nextSortDirection(currentDirection);
                          onSortChange?.({
                            field: header.id,
                            direction: newDirection,
                          });
                        }}
                      >
                        <div className="flex flex-row gap-1 items-center">
                          <SortIcon direction={currentDirection} />
                          <span className="truncate" title={header.id}>
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                          </span>
                        </div>
                      </Button>
                      {header.column.getCanResize() && (
                        <div
                          role="button"
                          tabIndex={0}
                          onMouseDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}
                          className={clsx(
                            "absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none",
                            header.column.getIsResizing() && "bg-amber-500/50",
                          )}
                        />
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {paddingTop > 0 && (
              <tr>
                <td style={{ height: `${paddingTop}px` }} />
              </tr>
            )}
            {virtualRows.map((virtualRow) => {
              const row = rows[virtualRow.index];
              return (
                <tr
                  key={row.id}
                  ref={rowVirtualizer.measureElement}
                  data-index={virtualRow.index}
                  className="hover:ring-1 hover:ring-amber-500 hover:z-10 relative"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-3 py-1 transition-colors hover:transition-none hover:bg-amber-400/10 break-words"
                      style={{
                        width: cell.column.getSize(),
                        minWidth: cell.column.columnDef.minSize,
                        maxWidth: cell.column.columnDef.maxSize,
                        wordBreak: "break-word",
                      }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
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
