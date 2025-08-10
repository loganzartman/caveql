export function colorScale(i: number, n: number): string {
  return `oklch(70% 0.15 ${(i / n) * 360})`;
}
