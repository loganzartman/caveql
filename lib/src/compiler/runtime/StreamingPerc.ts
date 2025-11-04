export class StreamingPerc {
  private values: number[] = [];
  private tDigest: TDigest | undefined;
  private exact: boolean = false;

  constructor({ exact }: { exact?: boolean } = {}) {
    this.exact = exact ?? false;
  }

  add(value: number) {
    if (this.tDigest) {
      this.tDigest.add(value);
      return;
    }

    this.values.push(value);

    if (this.exact) {
      return;
    }

    if (this.values.length > 10000) {
      this.tDigest = new TDigest({ compression: 10000 });
      for (const value of this.values) {
        this.tDigest.add(value);
      }
    }
  }

  getPercentile(percentile: number): number {
    if (this.tDigest) {
      return this.tDigest.getPercentile(percentile);
    }
    return this.nearestRank(this.values, percentile);
  }

  private nearestRank(values: number[], percentile: number): number {
    const sorted = values.sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * (percentile / 100));
    return sorted[Math.max(index - 1, 0)];
  }
}

class TDigest {
  private readonly compression: number;
  private centroids: [number, number][] = [];
  private count = 0;
  private dirty = true;

  constructor({ compression }: { compression: number }) {
    this.compression = compression;
  }

  add(value: number) {
    this.count++;
    this.centroids.push([value, 1]);
    this.dirty = true;

    if (this.centroids.length > this.compression * 10) {
      this.compress();
    }
  }

  getPercentile(percentile: number): number {
    this.compress();

    const targetWeight = (percentile / 100) * this.count;

    let i = 0;
    let cumulativeWeight = 0;
    for (const [mean, weight] of this.centroids) {
      if (cumulativeWeight + weight >= targetWeight) {
        if (i === 0) {
          return mean;
        }

        const [prevMean] = this.centroids[i - 1];
        const deltaFraction = (targetWeight - cumulativeWeight) / weight;
        return prevMean + (mean - prevMean) * deltaFraction;
      }
      cumulativeWeight += weight;
      i++;
    }

    return this.centroids[this.centroids.length - 1][0];
  }

  private compress() {
    if (!this.dirty) {
      return;
    }
    this.dirty = false;

    this.centroids.sort((a, b) => a[0] - b[0]);

    const compressed: [number, number][] = [];
    let cumulativeWeight = 0;

    for (const [mean, weight] of this.centroids) {
      cumulativeWeight += weight;

      const isExtreme =
        cumulativeWeight <= 1 || cumulativeWeight >= this.count - 1;
      if (isExtreme) {
        compressed.push([mean, weight]);
        continue;
      }

      const q = cumulativeWeight / this.count;
      const k = this.scaleFn(q) * this.compression;

      if (compressed.length > 0 && k - compressed.length < 1) {
        const [lastMean, lastWeight] = compressed[compressed.length - 1];
        const newMean =
          (lastMean * lastWeight + mean * weight) / (lastWeight + weight);
        compressed[compressed.length - 1] = [newMean, lastWeight + weight];
      } else {
        compressed.push([mean, weight]);
      }
    }

    this.centroids = compressed;
  }

  private scaleFn(q: number): number {
    // k2 scale function
    return q <= 0.5 ? 2 * q * q : 1 - 2 * (1 - q) * (1 - q);
  }
}
