export function getSourceLocation({
  source,
  offset,
}: {
  source: string;
  offset: number;
}): { line: number; column: number } {
  const lines = source.slice(0, offset).split(/\r\n|\r|\n/);
  const line = lines.length - 1;
  const column = lines[line].length;

  return { line, column };
}
