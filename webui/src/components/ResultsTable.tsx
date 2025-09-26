import { Button } from "@headlessui/react";
import {
  ChevronDownIcon,
  ChevronUpDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/20/solid";
import { useVirtualizer } from "@tanstack/react-virtual";
import clsx from "clsx";
import { useMemo, useState } from "react";
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
  scrollRef,
  sort,
  onSortChange,
}: {
  results: Record<string, unknown>[];
  scrollRef: React.RefObject<HTMLElement | null>;
  sort?: SortMap;
  onSortChange?: SortChangeHandler;
}) {
  const [listRef, setListRef] = useState<HTMLDivElement | null>(null);

  const virtualizer = useVirtualizer({
    count: results.length,
    estimateSize: () => 32,
    getScrollElement: () => scrollRef.current,
    scrollMargin: listRef?.offsetTop ?? 0,
  });

  const cols = useMemo(
    () => [...new Set(Object.values(results).flatMap(Object.keys))],
    [results],
  );

  return (
    <div ref={setListRef} data-testid="list-el">
      {results.length === 0 && (
        <div className="w-full flex flex-row items-center justify-center">
          <div>No results.</div>
        </div>
      )}
      <div
        className="sticky z-10 flex flex-row -top-4 text-red-300 font-mono font-bold"
        style={{
          background:
            "color-mix(in srgb, var(--color-red-500), var(--color-stone-800) 90%)",
        }}
      >
        {cols.map((col) => (
          <Button
            key={col}
            className="flex-1 px-3 py-1 gap-1 flex flex-row items-center cursor-pointer"
            onClick={() => {
              const currentDirection = sort?.[col] ?? "none";
              const newDirection = nextSortDirection(currentDirection);
              onSortChange?.({
                field: col,
                direction: newDirection,
              });
            }}
          >
            <SortIcon direction={sort?.[col]} />
            {col}
          </Button>
        ))}
      </div>
      <div
        className="relative w-full flex flex-col"
        style={{
          height: `${virtualizer.getTotalSize()}px`,
        }}
      >
        {virtualizer.getVirtualItems().map((item) => (
          <div
            key={item.key}
            data-index={item.index}
            ref={virtualizer.measureElement}
            className={clsx(
              "flex flex-row absolute top-0 left-0 w-full hover:ring-1 hover:ring-amber-500 hover:z-10",
              item.index % 2 ? "bg-stone-800" : "bg-stone-900",
            )}
            style={{
              transform: `translateY(${
                item.start - virtualizer.options.scrollMargin
              }px)`,
            }}
          >
            {cols.map((col) => (
              <div
                key={col}
                className="flex-1 px-3 py-1 transition-colors hover:transition-none hover:bg-amber-400/10"
              >
                <ValView val={results[item.index][col]} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function SortIcon({ direction }: { direction?: SortDirection }) {
  if (direction === "asc") {
    return <ChevronUpIcon className="w-[1em]" />;
  }
  if (direction === "desc") {
    return <ChevronDownIcon className="w-[1em]" />;
  }
  if (direction === "none" || direction === undefined) {
    return <ChevronUpDownIcon className="w-[1em] opacity-50" />;
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
