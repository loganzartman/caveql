export function formatJS(code: string): string {
  const INDENT = "  ";
  let result = "";
  let depth = 0;
  let inString: string | null = null;

  for (let i = 0; i < code.length; i++) {
    const char = code[i];

    // string literals
    if ("\"'`".includes(char)) {
      if (inString === char && code[i - 1] !== "\\") {
        inString = null;
      } else {
        inString = char;
      }
      result += char;
      continue;
    }

    if (inString) {
      result += char;
      continue;
    }

    // Skip whitespace
    if (/\s/.test(char)) {
      if (result && !/\s$/.test(result)) result += " ";
      continue;
    }

    // Opening brackets (not parentheses)
    if ("{".includes(char)) {
      result += `${char}\n${INDENT.repeat(++depth)}`;
    }
    // Closing brackets (not parentheses)
    else if ("}".includes(char)) {
      result = result.replace(/\s*$/, "\n") + INDENT.repeat(--depth) + char;
    }
    // keep inline
    else if ("()[]".includes(char)) {
      result += char;
    }
    // Semicolons
    else if (char === ";") {
      result += `${char}\n${INDENT.repeat(depth)}`;
    }
    // Everything else
    else {
      result += char;
    }
  }

  return result.replace(/\n\s*\n/g, "\n").trim();
}
