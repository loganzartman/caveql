export function iter<T>(iterable: AsyncIterable<T>): AsyncIterator<T>;
export function iter<T>(iterable: Iterable<T>): Iterator<T>;
export function iter<T>(
  iterable: Iterable<T> | AsyncIterable<T>,
): Iterator<T> | AsyncIterator<T> {
  if (Symbol.asyncIterator in iterable) {
    return iterable[Symbol.asyncIterator]();
  } else {
    return iterable[Symbol.iterator]();
  }
}

export function asyncIter<T>(
  iterable: Iterable<T> | AsyncIterable<T>,
): AsyncIterator<T> {
  if (Symbol.asyncIterator in iterable) {
    return iterable[Symbol.asyncIterator]();
  } else {
    return (async function* () {
      for (const item of iterable) {
        yield item;
      }
    })();
  }
}
