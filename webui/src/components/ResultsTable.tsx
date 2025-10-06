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
  useReactTable,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import clsx from "clsx";
import { useMemo, useRef } from "react";
import { impossible } from "../impossible";
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

  // Create columns definition for TanStack Table
  const columns = useMemo<ColumnDef<Record<string, unknown>>[]>(
    () =>
      Array.from(fieldSet).map((col) => ({
        id: col,
        accessorFn: (row) => row[col],
        header: col,
        cell: (info) => <ValView val={info.getValue()} />,
        minSize: 60,
        maxSize: 500,
      })),
    [fieldSet],
  );

  const table = useReactTable({
    data: results as Array<Record<string, unknown>>,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    columnResizeMode: "onChange",
    enableColumnResizing: true,
  });

  const { rows } = table.getRowModel();

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 32, // initial estimate
    overscan: 10,
    measureElement: (element) => element?.getBoundingClientRect().height,
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
                            "absolute right-0 top-0 h-full w-1.5 cursor-col-resize select-none touch-none bg-red-300/20 hover:bg-red-300/50",
                            header.column.getIsResizing() && "bg-red-300/50",
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
                  className="hover:outline-1 hover:outline-amber-500 -outline-offset-1 hover:z-10 relative"
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
