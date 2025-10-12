import type React from "react";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { clamp } from "./clamp";

export type ColumnState = {
  id: string;
  width: string;
  measured: (contents: ReactNode) => ReactNode;
  resizeHandleProps: {
    tabIndex: number;
    onPointerDown: React.PointerEventHandler<HTMLDivElement>;
    onFocus: React.FocusEventHandler<HTMLDivElement>;
    onBlur: React.FocusEventHandler<HTMLDivElement>;
  };
};

export function useColumns({
  columns,
  padding,
  minWidth,
  maxWidth,
}: {
  columns: Iterable<string>;
  padding: number;
  minWidth: number;
  maxWidth: number;
}): ColumnState[] {
  const columnDraggingRef = useRef<string | null>(null);
  const columnDragStartRef = useRef<{ x: number; width: number } | null>(null);
  const columnFocusedRef = useRef<string | null>(null);
  const captureElementRef = useRef<[HTMLElement, number] | null>(null);

  const columnsArray = useMemo(() => Array.from(columns), [columns]);
  const columnsArrayRef = useRef(columnsArray);
  columnsArrayRef.current = columnsArray;

  const [customColumnsWidth, setCustomColumnsWidth] = useState<
    Record<string, number>
  >({});
  const customColumnsWidthRef = useRef(customColumnsWidth);
  customColumnsWidthRef.current = customColumnsWidth;

  const [intrinsicColumnsWidth, setIntrinsicColumnsWidth] = useState<
    Record<string, number>
  >({});
  const intrinsicColumnsWidthRef = useRef(intrinsicColumnsWidth);
  intrinsicColumnsWidthRef.current = intrinsicColumnsWidth;

  const columnsWidth = useMemo(
    () =>
      Object.fromEntries(
        columnsArray.map((column) => [
          column,
          clamp(
            customColumnsWidth[column] ?? intrinsicColumnsWidth[column] ?? 0,
            minWidth,
            maxWidth,
          ),
        ]),
      ),
    [
      columnsArray,
      customColumnsWidth,
      intrinsicColumnsWidth,
      minWidth,
      maxWidth,
    ],
  );
  const columnsWidthRef = useRef(columnsWidth);
  columnsWidthRef.current = columnsWidth;

  useEffect(() => {
    columnsArray;
    setIntrinsicColumnsWidth({});
  }, [columnsArray]);

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
      const newWidth = Math.max(
        minWidth,
        Math.min(maxWidth, columnDragStartRef.current.width + dx),
      );

      setCustomColumnsWidth((prev) => ({
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
        columnsWidthRef.current[focusedColumn] + dx,
        minWidth,
        maxWidth,
      );

      setCustomColumnsWidth((prev) => ({
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
  }, [maxWidth, minWidth]);

  return useMemo(
    () =>
      columnsArray.map(
        (id) =>
          ({
            id,

            width: `${columnsWidth[id]}px`,

            measured: (contents) => {
              const measure = (el: HTMLElement | null) => {
                if (!el) {
                  return;
                }

                const prevWidth = intrinsicColumnsWidthRef.current[id] ?? 0;
                const newWidth = el.getBoundingClientRect().width + padding;
                if (newWidth > prevWidth) {
                  intrinsicColumnsWidthRef.current[id] = newWidth;
                  setIntrinsicColumnsWidth((prev) => ({
                    ...prev,
                    [id]: newWidth,
                  }));
                }
              };

              return (
                <>
                  {contents}
                  <span ref={measure} inert className="fixed invisible">
                    {contents}
                  </span>
                </>
              );
            },

            resizeHandleProps: {
              tabIndex: 0,

              onPointerDown: (event) => {
                event.preventDefault();
                event.currentTarget.setPointerCapture(event.pointerId);

                captureElementRef.current = [
                  event.currentTarget,
                  event.pointerId,
                ];
                columnDraggingRef.current = id;
                columnDragStartRef.current = {
                  x: event.screenX,
                  width: columnsWidthRef.current[id],
                };
              },

              onFocus: () => {
                columnFocusedRef.current = id;
              },

              onBlur: () => {
                columnFocusedRef.current = null;
              },
            },
          }) satisfies ColumnState,
      ),
    [columnsArray, columnsWidth, padding],
  );
}
