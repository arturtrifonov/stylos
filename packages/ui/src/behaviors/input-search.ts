/** Commit the native clear action; event listeners receive the updated value. */
export function clearSearchInput(input: HTMLInputElement) {
  if (input.matches(":disabled") || input.readOnly || input.value === "") return;
  input.value = "";
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
  input.focus({ preventScroll: true });
}
