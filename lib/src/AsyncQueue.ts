/* biome-ignore-all lint/style/noNonNullAssertion: yolo */

/** single producer / single consumer async queue */
export class AsyncQueue<T> {
  private resolve: (() => void) | undefined;
  private hasWaiter = false;
  private values: T[] = [];

  private makePromise(): Promise<void> {
    return new Promise<void>((resolve) => {
      this.resolve = resolve;
    });
  }

  get length() {
    return this.values.length;
  }

  public push(value: T) {
    this.pushAll([value]);
  }

  public pushAll(values: T[]) {
    Array.prototype.push.apply(this.values, values);

    if (!this.hasWaiter) {
      return;
    }

    if (!this.resolve) {
      throw new Error("Invariant: hasWaiter but no resolve function");
    }

    this.resolve();
    this.hasWaiter = false;
  }

  public shift(): T | undefined {
    return this.values.shift();
  }

  public async wait(): Promise<void> {
    if (this.hasWaiter) {
      throw new Error("Invariant: only one waiter allowed");
    }

    if (this.values.length) {
      return;
    }

    this.hasWaiter = true;
    return this.makePromise();
  }

  public unblock() {
    if (!this.hasWaiter) {
      return;
    }

    if (!this.resolve) {
      throw new Error("Invariant: hasWaiter but no resolve function");
    }

    this.resolve();
    this.hasWaiter = false;
  }
}
