// biome-ignore lint/suspicious/noExplicitAny: type param
export function debounce<TFunc extends (...args: any[]) => void>(
  fn: TFunc,
  { intervalMs, leading = false }: { intervalMs: number; leading?: boolean },
): TFunc {
  const last = {
    args: undefined as Parameters<TFunc> | undefined,
  };
  let timeout: NodeJS.Timeout | undefined;

  return function debounced(...args: Parameters<TFunc>): void {
    last.args = args;

    if (timeout) {
      return;
    }

    if (leading) {
      fn(...args);
      last.args = undefined;
    }

    timeout = setTimeout(() => {
      if (last.args) fn(...last.args);
      last.args = undefined;
      timeout = undefined;
    }, intervalMs);
  } as TFunc;
}
