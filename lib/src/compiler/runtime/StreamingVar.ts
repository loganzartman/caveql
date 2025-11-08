export class StreamingVar {
  private mean: number = 0;
  private M2: number = 0;
  private n: number = 0;

  add(value: number) {
    this.n++;
    const delta = value - this.mean;
    this.mean += delta / this.n;
    const delta2 = value - this.mean;
    this.M2 += delta * delta2;
  }

  getVariance() {
    return this.M2 / (this.n - 1);
  }

  getStdev() {
    return Math.sqrt(this.getVariance());
  }
}
