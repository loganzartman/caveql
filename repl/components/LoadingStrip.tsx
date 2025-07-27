import clsx from "clsx";

export function LoadingStrip({ isLoading }: { isLoading: boolean }) {
  return (
    <div
      className={clsx(
        "loading-strip-bg",
        "h-1 bg-amber-200 delay-0 duration-200 transition-opacity opacity-0",
        isLoading && "opacity-100 delay-200",
      )}
    />
  );
}
