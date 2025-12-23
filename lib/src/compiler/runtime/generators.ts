export function splitAsyncGenerator<T>(
  generator: AsyncGenerator<T>,
  count: number,
): AsyncGenerator<T>[] {
  const it = generator[Symbol.asyncIterator]();
  return Array.from(
    { length: count },
    (): AsyncGenerator<T> =>
      (async function* () {
        while (true) {
          const { value, done } = await it.next();
          if (done) {
            return;
          }
          yield value;
        }
      })(),
  );
}

export async function* joinAsyncGenerators<T>(
  generators: AsyncGenerator<T>[],
): AsyncGenerator<T> {
  const pending = new Map(
    generators.map(
      (gen, i) => [i, gen.next().then((result) => ({ i, result }))] as const,
    ),
  );

  while (pending.size > 0) {
    const { i, result } = await Promise.race(pending.values());
    pending.delete(i);
    if (!result.done) {
      yield result.value;
      pending.set(
        i,
        generators[i].next().then((result) => ({ i, result })),
      );
    }
  }
}
