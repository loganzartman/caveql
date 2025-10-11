import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";

export type ColumnState = {
  id: string;
  width: number;
  resizeHandleProps: {
    onPointerDown: React.PointerEventHandler<HTMLDivElement>;
    onFocus: React.FocusEventHandler<HTMLDivElement>;
    onBlur: React.FocusEventHandler<HTMLDivElement>;
  };
};

export function useColumns({
  columns,
  defaultWidth,
  minWidth,
  maxWidth,
}: {
  columns: Iterable<string>;
  defaultWidth: number;
  minWidth: number;
  maxWidth: number;
}): ColumnState[] {
  const columnsArray = useMemo(() => Array.from(columns), [columns]);
  const [columnsWidth, setColumnsWidth] = useState<Record<string, number>>({});
  const columnDraggingRef = useRef<string | null>(null);
  const columnDragStartRef = useRef<{ x: number; width: number } | null>(null);
  const columnFocusedRef = useRef<string | null>(null);

  const columnsArrayRef = useRef(columnsArray);
  columnsArrayRef.current = columnsArray;
  const columnsWidthRef = useRef(columnsWidth);
  columnsWidthRef.current = columnsWidth;

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (!columnDraggingRef.current) {
        return;
      }

      if (!columnDragStartRef.current) {
        return;
      }

      const column = columnsArray.find(
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

      const newColumnWidth = Math.min(
        maxWidth,
        Math.max(
          minWidth,
          (columnsWidthRef.current[focusedColumn] ?? defaultWidth) + dx,
        ),
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
  }, [columnsArray, maxWidth, minWidth, defaultWidth]);

  return useMemo(
    () =>
      columnsArray.map((id) => ({
        id,
        width: columnsWidth[id] ?? defaultWidth,
        resizeHandleProps: {
          tabIndex: 0,
          onPointerDown: (event) => {
            event.preventDefault();
            columnDraggingRef.current = id;
            columnDragStartRef.current = {
              x: event.screenX,
              width: columnsWidth[id] ?? defaultWidth,
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
    [columnsArray, columnsWidth, defaultWidth],
  );
}
