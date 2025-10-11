import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { clamp } from "./clamp";

export type ColumnState = {
  id: string;
  width: string;
  measure: (el: HTMLElement | null) => void;
  resizeHandleProps: {
    onPointerDown: React.PointerEventHandler<HTMLDivElement>;
    onFocus: React.FocusEventHandler<HTMLDivElement>;
    onBlur: React.FocusEventHandler<HTMLDivElement>;
  };
};

export function useColumns({
  columns,
  minWidth,
  maxWidth,
}: {
  columns: Iterable<string>;
  minWidth: number;
  maxWidth: number;
}): ColumnState[] {
  const columnsArray = useMemo(() => Array.from(columns), [columns]);
  const [columnsWidth, setColumnsWidth] = useState<Record<string, number>>({});
  const [defaultColumnsWidth, setDefaultColumnsWidth] = useState<
    Record<string, number>
  >({});
  const columnDraggingRef = useRef<string | null>(null);
  const columnDragStartRef = useRef<{ x: number; width: number } | null>(null);
  const columnFocusedRef = useRef<string | null>(null);
  const captureElementRef = useRef<[HTMLElement, number] | null>(null);

  const columnsArrayRef = useRef(columnsArray);
  columnsArrayRef.current = columnsArray;
  const columnsWidthRef = useRef(columnsWidth);
  columnsWidthRef.current = columnsWidth;
  const measuredColumnWidthsRef = useRef<Record<string, number>>({});
  const defaultColumnWidthsRef = useRef(defaultColumnsWidth);
  defaultColumnWidthsRef.current = defaultColumnsWidth;

  if (
    Object.keys(measuredColumnWidthsRef.current).some(
      (k) =>
        measuredColumnWidthsRef.current[k] !==
        defaultColumnWidthsRef.current[k],
    )
  ) {
    setDefaultColumnsWidth({ ...measuredColumnWidthsRef.current });
  }

  const columnWidth = useCallback(
    (column: string) =>
      columnsWidthRef.current[column] ??
      defaultColumnWidthsRef.current[column] ??
      minWidth,
    [minWidth],
  );

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (!columnDraggingRef.current) {
        return;
      }

      if (!columnDragStartRef.current) {
        return;
      }

      const column = columnsArrayRef.current.find(
        (id) => columnDraggingRef.current === id,
      );
      if (!column) {
        return;
      }

      const dx = event.screenX - columnDragStartRef.current.x;
      console.log(dx);
      const newWidth = Math.max(
        minWidth,
        Math.min(maxWidth, columnDragStartRef.current.width + dx),
      );
      setColumnsWidth((prev) => ({
        ...prev,
        [column]: newWidth,
      }));
    };

    const handlePointerUp = () => {
      columnDraggingRef.current = null;
      columnDragStartRef.current = null;
      if (captureElementRef.current) {
        const [elem, pointerId] = captureElementRef.current;
        elem.releasePointerCapture(pointerId);
        captureElementRef.current = null;
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const focusedColumn = columnFocusedRef.current;
      if (!focusedColumn) {
        return;
      }

      let dx = 0;
      if (event.key === "ArrowLeft") {
        dx = -10;
      } else if (event.key === "ArrowRight") {
        dx = 10;
      }

      if (dx === 0) {
        return;
      }

      event.preventDefault();

      const newColumnWidth = clamp(
        columnWidth(focusedColumn) + dx,
        minWidth,
        maxWidth,
      );
      console.log(newColumnWidth);
      setColumnsWidth((prev) => ({
        ...prev,
        [focusedColumn]: newColumnWidth,
      }));
    };

    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [maxWidth, minWidth, columnWidth]);

  return useMemo(
    () =>
      columnsArray.map((id) => ({
        id,
        width: columnsWidth[id]
          ? `${columnsWidth[id]}px`
          : defaultColumnsWidth[id]
            ? `${defaultColumnsWidth[id]}px`
            : "auto",
        measure: (el: HTMLElement | null) => {
          if (!el) {
            return;
          }
          const rect = el.getBoundingClientRect();
          const newWidth = clamp(rect.width, minWidth, maxWidth);
          measuredColumnWidthsRef.current[id] = Math.max(
            measuredColumnWidthsRef.current[id] ?? minWidth,
            newWidth,
          );
        },
        resizeHandleProps: {
          tabIndex: 0,
          onPointerDown: (event) => {
            event.preventDefault();
            event.currentTarget.setPointerCapture(event.pointerId);

            captureElementRef.current = [event.currentTarget, event.pointerId];
            columnDraggingRef.current = id;
            columnDragStartRef.current = {
              x: event.screenX,
              width: columnsWidth[id] ?? columnWidth(id),
            };
          },
          onFocus: () => {
            columnFocusedRef.current = id;
          },
          onBlur: () => {
            columnFocusedRef.current = null;
          },
        },
      })),
    [
      columnWidth,
      columnsArray,
      columnsWidth,
      defaultColumnsWidth,
      maxWidth,
      minWidth,
    ],
  );
}
