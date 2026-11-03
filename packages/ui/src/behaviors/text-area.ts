/** Native length attributes accept nonnegative integers, including zero. */
export function nativeLengthLimit(value?: number): number | undefined {
  return value !== undefined && Number.isInteger(value) && value >= 0 ? value : undefined;
}

/** Count native textarea UTF-16 units, normalizing CR/CRLF to its LF value. */
export function textAreaCounter(value: string, maximum?: number, custom?: string): string {
  if (custom !== undefined) return custom;
  const count = value.replace(/\r\n?/g, "\n").length;
  const limit = nativeLengthLimit(maximum);
  return limit === undefined ? `${count}` : `${count} / ${limit}`;
}

/** The counter as words for the textarea's description: "13 / 40" alone does
 * not say what is counted (verification/orca-2026-11-03.md). */
export function textAreaCounterDescription(value: string, maximum?: number, custom?: string): string {
  if (custom !== undefined) return custom;
  const count = value.replace(/\r\n?/g, "\n").length;
  const limit = nativeLengthLimit(maximum);
  const unit = (limit ?? count) === 1 ? "character" : "characters";
  return limit === undefined ? `${count} ${unit}` : `${count} of ${limit} ${unit}`;
}
