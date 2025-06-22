export function formatJS(code: string): string {
	const INDENT = "  ";
	let result = "";
	let depth = 0;

	for (let i = 0; i < code.length; i++) {
		const char = code[i];

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
