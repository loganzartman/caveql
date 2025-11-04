export class StreamingMode {
  private modeValue: unknown;
  private modeCount: number = 0;
  private counts: Map<string, number> = new Map();

  add(value: string) {
    const count = this.counts.get(value) ?? 0;
    if (count > this.modeCount) {
      this.modeValue = value;
      this.modeCount = count;
    }
    this.counts.set(value, count + 1);
  }

  getMode(): unknown {
    return this.modeValue;
  }
}
