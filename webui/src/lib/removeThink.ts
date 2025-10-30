/**
 * Removes <think>...</think> tags from the content.
 * These tags are used by some models to show their reasoning process.
 */
export function removeThink(content: string): string {
  return content.replace(/<think>[\s\S]*<\/think>/g, "").trim();
}
