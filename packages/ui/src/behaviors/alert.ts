/** The text an alert announces when it opens: its heading, then its content.
 * The pause between them is a full stop, as Orca joins a name and content,
 * unless the heading already ends in punctuation. */
export function alertMessage(heading: string, content: string): string {
  const parts = [heading.trim(), content.trim()].filter(Boolean);
  if (parts.length < 2) return parts.join("");
  return /[\p{Terminal_Punctuation}…]$/u.test(parts[0]) ? parts.join(" ") : parts.join(". ");
}
