import { Button } from "@headlessui/react";
import {
  ChevronDownIcon,
  ChevronUpDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/20/solid";
import { useVirtualizer } from "@tanstack/react-virtual";
import clsx from "clsx";
import { useMemo, useRef, useState } from "react";
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
  const [scrollRef, setScrollRef] = useState<HTMLDivElement | null>(null);

  const virtualizer = useVirtualizer({
    count: results.length,
    getScrollElement: () => scrollRef,
    estimateSize: () => 32,
    getItemKey: (i) => i,
  });

  const cols = useMemo(() => Array.from(results.fieldSet), [results]);

  return (
    <div
      ref={setScrollRef}
      className="grow-1 shrink-1 basis-0 relative overflow-auto"
    >
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        <table className="w-full table-auto">
          {results.length === 0 && (
            <tbody>
              <tr className="w-full flex flex-row items-center justify-center">
                <td>No results.</td>
              </tr>
            </tbody>
          )}
          <thead
            className="text-red-300 font-mono font-bold"
            style={{
              background:
                "color-mix(in srgb, var(--color-red-500), var(--color-stone-800) 90%)",
            }}
          >
            <tr>
              {cols.map((col) => (
                <Button
                  key={col}
                  as="th"
                  className="px-3 py-1 cursor-pointer"
                  onClick={() => {
                    const currentDirection = sort?.[col] ?? "none";
                    const newDirection = nextSortDirection(currentDirection);
                    onSortChange?.({
                      field: col,
                      direction: newDirection,
                    });
                  }}
                >
                  <div className="flex flex-row gap-1 items-center">
                    <SortIcon direction={sort?.[col]} />
                    {col}
                  </div>
                </Button>
              ))}
            </tr>
          </thead>
          <tbody className="relative">
            {virtualizer.getVirtualItems().map((item, index) => (
              <tr
                key={item.key}
                data-index={item.index}
                className="hover:ring-1 hover:ring-amber-500 hover:z-10"
                style={{
                  height: `${item.size}px`,
                  transform: `translateY(${item.start - index * item.size}px)`,
                }}
              >
                {cols.map((col) => (
                  <td
                    key={col}
                    className="flex-1 px-3 py-1 transition-colors hover:transition-none hover:bg-amber-400/10"
                  >
                    <ValView val={results.at(item.index)?.[col]} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
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
