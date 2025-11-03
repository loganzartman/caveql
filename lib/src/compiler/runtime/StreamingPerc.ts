export class StreamingPerc {
  private values: number[] = [];
  private tDigest: TDigest | undefined;

  add(value: number) {
    if (this.tDigest) {
      this.tDigest.add(value);
      return;
    }

    this.values.push(value);

    if (this.values.length > 1000) {
      this.tDigest = new TDigest(100);
      for (const value of this.values) {
        this.tDigest.add(value);
      }
    }
  }

  getPercentile(percentile: number): number {
    if (this.tDigest) {
      return this.tDigest.getPercentile(percentile);
    }
    return nearestRank(this.values, percentile);
  }
}

class TDigest {
  private centroids: [number, number][] = [];
  private count = 0;
  constructor(public readonly compression: number) {}

  add(value: number) {
    this.count++;
    this.centroids.push([value, 1]);

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
      if (cumulativeWeight >= targetWeight) {
        if (i === 0) {
          return mean;
        }

        const [prevMean, prevWeight] = this.centroids[i - 1];
        const deltaFraction = (targetWeight - cumulativeWeight) / prevWeight;
        return prevMean + (mean - prevMean) * deltaFraction;
      }
      cumulativeWeight += weight;
      i++;
    }

    return this.centroids[this.centroids.length - 1][0];
  }

  private compress() {
    this.centroids.sort((a, b) => a[0] - b[0]);

    const compressed: [number, number][] = [];
    let cumulativeWeight = 0;

    for (const [mean, weight] of this.centroids) {
      cumulativeWeight += weight;

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
    return Math.asin(2 * q - 1) / Math.PI + 0.5;
  }
}

function nearestRank(values: number[], percentile: number): number {
  const sorted = values.sort((a, b) => a - b);
  const index = Math.ceil(sorted.length * (percentile / 100));
  return sorted[Math.max(index - 1, 0)];
}
