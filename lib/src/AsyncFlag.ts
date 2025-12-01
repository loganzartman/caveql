export class AsyncFlag {
  private resolve!: () => void;
  private promise!: Promise<void>;
  private flag = false;

  constructor(flag = false) {
    this.makePromise();
    this.set(flag);
  }

  private makePromise() {
    this.promise = new Promise((resolve) => {
      this.resolve = resolve;
    });
  }

  public set(value: boolean) {
    if (value === this.flag) {
      return;
    }
    if (value) {
      this.flag = true;
      this.resolve();
    } else {
      this.flag = false;
      this.makePromise();
    }
  }

  public wait(): Promise<void> {
    return this.promise;
  }
}
