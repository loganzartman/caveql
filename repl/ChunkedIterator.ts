export type ChunkedAsyncIteratorParams = { chunkSize: number };

export class ChunkedAsyncIterator<T, TReturn = any, TNext = any>
  implements AsyncIterator<T[], TReturn, TNext>
{
  readonly it: AsyncIterator<T>;
  readonly chunkSize: number;
  #done = false;
  #retVal: TReturn | undefined;

  constructor(
    it: AsyncIterator<T, TReturn, TNext>,
    { chunkSize }: ChunkedAsyncIteratorParams,
  ) {
    this.it = it;
    this.chunkSize = chunkSize;
  }

  async next(...[input]: [] | [TNext]): Promise<IteratorResult<T[], TReturn>> {
    if (this.#done) {
      return {
        done: true,
        value: this.#retVal!,
      };
    }

    const value: T[] = [];

    for (let i = 0; i < this.chunkSize; ++i) {
      const result = await this.it.next(input);
      if (result.done) {
        this.#done = true;
        this.#retVal = result.value;
        break;
      }
      value.push(result.value);
    }

    return {
      done: false,
      value,
    };
  }

  async return(
    value?: TReturn | PromiseLike<TReturn>,
  ): Promise<IteratorResult<T[], TReturn>> {
    if (!this.it.return) {
      return { done: true, value: undefined as TReturn };
    }
    const result = await this.it.return?.(value);
    return {
      done: true,
      value: result.value,
    };
  }

  async throw(e?: unknown): Promise<IteratorResult<T[], TReturn>> {
    if (!this.it.throw) {
      return { done: true, value: undefined as TReturn };
    }
    const result = await this.it.throw(e);
    return {
      done: true,
      value: result.value,
    };
  }
}

export class ChunkedAsyncIterable<T, TNext = any, TReturn = any>
  implements AsyncIterable<T[], TNext, TReturn>
{
  iterable: AsyncIterable<T, TNext, TReturn>;
  params: ChunkedAsyncIteratorParams;

  constructor(
    iterable: AsyncIterable<T, TNext, TReturn>,
    params: ChunkedAsyncIteratorParams,
  ) {
    this.iterable = iterable;
    this.params = params;
  }

  [Symbol.asyncIterator]() {
    return new ChunkedAsyncIterator(
      this.iterable[Symbol.asyncIterator](),
      this.params,
    );
  }
}
