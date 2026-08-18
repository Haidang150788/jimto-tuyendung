/** Joins a short list fully, or truncates a long one to "A, B +N nơi khác". */
export function summarizeList(items: string[], maxVisible = 2): string {
  if (items.length <= maxVisible) return items.join(", ");
  const shown = items.slice(0, maxVisible).join(", ");
  const rest = items.length - maxVisible;
  return `${shown} +${rest} nơi khác`;
}
