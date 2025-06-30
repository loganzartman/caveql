"use no memo";
import { useVirtualizer } from "@tanstack/react-virtual";
import clsx from "clsx";
import { useEffect, useMemo, useRef, useState } from "react";

export function ResultsTable({
  results,
  scrollRef,
}: {
  results: Record<string, unknown>[];
  scrollRef: React.RefObject<HTMLElement | null>;
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
      <div className="sticky z-10 flex flex-row -top-4 bg-stone-400 text-stone-950 font-bold">
        {cols.map((col) => (
          <div key={col} className="flex-1 px-3 py-1">
            {col}
          </div>
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
              "flex flex-row absolute top-0 left-0 w-full hover:ring-1 hover:ring-amber-600 hover:z-10 hover:text-amber-300",
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
                className="flex-1 px-3 py-1 hover:bg-amber-900/50 hover:text-amber-100"
              >
                {String(results[item.index][col])}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
