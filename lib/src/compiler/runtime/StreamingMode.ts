export class StreamingMode {
  private modeValue: unknown;
  private modeCount: number = 0;
  private counts: Map<string, number> = new Map();

  add(value: string) {
    const newCount = (this.counts.get(value) ?? 0) + 1;
    this.counts.set(value, newCount);
    if (newCount > this.modeCount) {
      this.modeValue = value;
      this.modeCount = newCount;
    }
  }

  getMode(): unknown {
    return this.modeValue;
  }
}
