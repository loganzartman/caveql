/** biome-ignore-all lint/style/noNonNullAssertion: yolo */

export class AsyncEmitter<T> {
  private resolve: ((value: T) => void) | undefined;
  private reject: ((reason?: unknown) => void) | undefined;
  private _promise: Promise<T> | undefined;

  private replacePromise(): void {
    this._promise = new Promise<T>((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }

  constructor() {
    this.replacePromise();
  }

  public emit(value: T): void {
    const resolve = this.resolve!;
    this.replacePromise();
    resolve(value);
  }

  public error(reason?: unknown): void {
    const reject = this.reject!;
    this.replacePromise();
    reject(reason);
  }

  public wait(): Promise<T> {
    return this._promise!;
  }
}
