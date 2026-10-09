// Native radios own group identity, keyboard, validity and form data. A change
// fires only on the newly selected radio; mirror the resulting checked values
// back to every managed option, including when an unmanaged radio is selected.
export type RadioSelection = "false" | "true";
export type RadioOptions = {
  isChecked: RadioSelection;
  // Identity props also trigger action updates after native regrouping.
  name?: string;
  form?: string;
  onChange: (selection: RadioSelection) => void;
};
type Record = { input: HTMLInputElement; selection: RadioSelection; options: RadioOptions };
type Tracker = { records: Set<Record>; sync: () => void; dispose: () => void };
const trackers = new WeakMap<Node, Tracker>();

function trackerFor(root: Node): Tracker {
  const existing = trackers.get(root);
  if (existing) return existing;
  const records = new Set<Record>();
  function sync() {
    for (const record of records) {
      const selection = record.input.checked ? "true" : "false";
      if (selection === record.selection) continue;
      record.selection = selection;
      record.options.onChange(selection);
    }
  }
  function change(event: Event) {
    const target = event.target as HTMLInputElement | null;
    if (target?.tagName === "INPUT" && target.type === "radio") sync();
  }
  function reset(event: Event) {
    if (![...records].some(record => record.input.form === event.target)) return;
    // A user-triggered reset can run microtasks between event listeners,
    // before its default action. Read in the next task, after native reset.
    setTimeout(() => { if (!event.defaultPrevented) sync(); }, 0);
  }
  const document = root.ownerDocument ?? root;
  root.addEventListener("change", change, true);
  root.addEventListener("reset", reset, true);
  if (document !== root) document.addEventListener("reset", reset, true);
  const tracker = {
    records, sync,
    dispose() {
      root.removeEventListener("change", change, true);
      root.removeEventListener("reset", reset, true);
      if (document !== root) document.removeEventListener("reset", reset, true);
      trackers.delete(root);
    },
  };
  trackers.set(root, tracker);
  return tracker;
}

export function radioBehavior(input: HTMLInputElement, initial: RadioOptions) {
  let root = input.getRootNode();
  let tracker = trackerFor(root);
  const record: Record = { input, selection: initial.isChecked, options: initial };
  input.defaultChecked = initial.isChecked === "true";
  input.checked = initial.isChecked === "true";
  tracker.records.add(record);
  tracker.sync();
  return {
    update(next: RadioOptions) {
      const nextRoot = input.getRootNode();
      if (nextRoot !== root) {
        tracker.records.delete(record);
        if (!tracker.records.size) tracker.dispose();
        root = nextRoot;
        tracker = trackerFor(root);
        tracker.records.add(record);
      }
      record.options = next;
      if (next.isChecked !== record.selection) input.checked = next.isChecked === "true";
      tracker.sync();
    },
    destroy() {
      tracker.records.delete(record);
      if (!tracker.records.size) tracker.dispose();
    },
  };
}
