import type { Snippet } from "svelte";

export const switcherContext = Symbol("stylos-switcher");
export const tabsContext = Symbol("stylos-tabs");
/** What Tabs Horizontal needs to offer a tab in its overflow menu. */
export interface TabEntry {
  value: string;
  label: string;
  disabled: boolean;
  icon?: Snippet;
}
export interface SelectionContext {
  value: () => string;
  size: () => "extra small" | "small" | "medium" | "large" | "extra large";
  tone?: () => "base" | "primary";
  name?: () => string;
  form?: () => string | undefined;
  initialValue: string;
  select: (value: string, event: Event) => void;
  register?: (entry: () => TabEntry) => () => void;
}
