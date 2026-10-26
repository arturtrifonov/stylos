import { singleSelectBehavior } from "./single-select.ts";

export type DropdownBehaviorOptions = {
  id: string;
  value: string;
  accessibleName: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  placement?: "bottom-start" | "bottom-end" | "top-start" | "top-end";
  /** Match the panel to the trigger's width (default). */
  sameWidth?: boolean;
};

// Select shares this adapter internally; Dropdown's external-trigger contract
// remains a plain single-choice panel without form participation.
export function dropdownBehavior(root: HTMLElement, options: DropdownBehaviorOptions) {
  return singleSelectBehavior(root, options);
}
