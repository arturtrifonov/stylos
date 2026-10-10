// Native input owns activation, keyboard, validity and form participation.
// This adapter supplies the indeterminate state and synchronises form reset
// with the consumer's selection, independently of Svelte.
export type CheckboxSelection = "false" | "true" | "mixed";
export type CheckboxOptions = {
  isChecked: CheckboxSelection;
  onChange: (selection: CheckboxSelection) => void;
};

export function checkboxBehavior(input: HTMLInputElement, initial: CheckboxOptions) {
  let options = initial;
  const defaultSelection = initial.isChecked;
  let destroyed = false;
  function apply(selection: CheckboxSelection) {
    input.checked = selection === "true";
    input.indeterminate = selection === "mixed";
  }
  function change() {
    options.onChange(input.indeterminate ? "mixed" : input.checked ? "true" : "false");
  }
  function reset(event: Event) {
    if (event.target !== input.form) return;
    // Trusted event dispatch can checkpoint microtasks between listeners.
    // Wait for the next task so later form listeners can cancel native reset.
    setTimeout(() => {
      if (destroyed || event.defaultPrevented) return;
      apply(defaultSelection);
      options.onChange(defaultSelection);
    }, 0);
  }
  input.defaultChecked = defaultSelection === "true";
  apply(initial.isChecked);
  input.addEventListener("change", change);
  input.ownerDocument.addEventListener("reset", reset, true);
  return {
    update(next: CheckboxOptions) { options = next; apply(next.isChecked); },
    destroy() {
      destroyed = true;
      input.removeEventListener("change", change);
      input.ownerDocument.removeEventListener("reset", reset, true);
    },
  };
}
