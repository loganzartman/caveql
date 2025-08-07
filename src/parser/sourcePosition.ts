/** Convert 0-index index into 1-indexed (line, column) */
export function getSourcePosition({
  source,
  index,
}: {
  source: string;
  index: number;
}): { line: number; column: number } {
  const lines = source.slice(0, index).split(/\r\n|\r|\n/);
  const line = lines.length;
  const column = lines[line - 1].length + 1;

  return { line, column };
}

/** Convert 1-indexed (line, column) into 0-indexed index */
export function getSourceIndex({
  source,
  line,
  column,
}: {
  source: string;
  line: number;
  column: number;
}): number {
  let currentLine = 1;
  let currentColumn = 1;
  let i = 0;

  while (i < source.length) {
    if (currentLine === line && currentColumn === column) {
      break;
    }

    const newlineMatch = source.substring(i).match(/^(\r\n|\r|\n)/)?.[0];
    if (newlineMatch) {
      currentLine++;
      currentColumn = 1;
      i += newlineMatch.length;
    } else {
      currentColumn++;
      i++;
    }
  }

  return i;
}
