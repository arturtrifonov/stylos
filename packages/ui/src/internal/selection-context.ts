export const switcherContext = Symbol("stylos-switcher");
export const tabsContext = Symbol("stylos-tabs");
export interface SelectionContext {
  value: () => string;
  size: () => "extra small" | "small" | "medium" | "large" | "extra large";
  tone?: () => "base" | "primary";
  name?: () => string;
  form?: () => string | undefined;
  initialValue: string;
  select: (value: string, event: Event) => void;
}
