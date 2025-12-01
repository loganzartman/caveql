import clsx from "clsx";

export function LoadingStrip({
  isLoading,
  progress,
}: {
  isLoading: boolean;
  progress?: number | null;
}) {
  const isDeterminate = progress != null && progress >= 0;

  return (
    <div
      className={clsx(
        "h-1 delay-0 duration-200 transition-opacity opacity-0 overflow-hidden",
        isLoading && "opacity-100 delay-200",
        isDeterminate && "bg-stone-300 dark:bg-stone-700",
      )}
    >
      <div
        className="h-full w-full transition-[clip-path] duration-150"
        style={
          isDeterminate
            ? {
                clipPath: `inset(0 ${100 - Math.min(progress * 100, 100)}% 0 0)`,
              }
            : undefined
        }
      >
        <div className="loading-strip-bg h-full w-full" />
      </div>
    </div>
  );
}
