// @stylos/ui — the public surface. One export per built component; the props
// types beside them are generated from the registry (tools/build-ui-types.mjs)
// and are re-exported so a consumer types against the contract, not a copy.
export { default as Badge } from "./components/badge/Badge.svelte";
export type { BadgeProps } from "./components/badge/props.ts";
export { default as Icon } from "./components/icon/Icon.svelte";
export type { IconProps } from "./components/icon/props.ts";
export { registerIcons, resolveIcon } from "./components/icon/registry.ts";
export type { RegisteredIcon } from "./components/icon/registry.ts";
export type { IconDrawing, IconName } from "./components/icon/icons.ts";
export { default as IndicatorSpecial } from "./components/indicator-special/IndicatorSpecial.svelte";
export type { IndicatorSpecialProps } from "./components/indicator-special/props.ts";
export { default as IndicatorStatus } from "./components/indicator-status/IndicatorStatus.svelte";
export type { IndicatorStatusProps } from "./components/indicator-status/props.ts";
export { default as Label } from "./components/label/Label.svelte";
export type { LabelProps } from "./components/label/props.ts";

export { default as InputText } from "./components/input-text/InputText.svelte";
export type { InputTextProps } from "./components/input-text/props.ts";
export { inputTextBehavior } from "./behaviors/input-text.ts";
export { default as Loader } from "./components/loader/Loader.svelte";
export type { LoaderProps } from "./components/loader/props.ts";
export { default as Tooltip } from "./components/tooltip/Tooltip.svelte";
export type { TooltipProps } from "./components/tooltip/props.ts";
export { default as CheckboxInput } from "./components/checkbox-input/CheckboxInput.svelte";
export type { CheckboxInputProps } from "./components/checkbox-input/props.ts";
export { default as CheckboxLabel } from "./components/checkbox-label/CheckboxLabel.svelte";
export type { CheckboxLabelProps } from "./components/checkbox-label/props.ts";
export { default as CheckboxText } from "./components/checkbox-text/CheckboxText.svelte";
export type { CheckboxTextProps } from "./components/checkbox-text/props.ts";
export { default as RadioInput } from "./components/radio-input/RadioInput.svelte";
export type { RadioInputProps } from "./components/radio-input/props.ts";
export { default as RadioLabel } from "./components/radio-label/RadioLabel.svelte";
export type { RadioLabelProps } from "./components/radio-label/props.ts";
export { default as RadioText } from "./components/radio-text/RadioText.svelte";
export type { RadioTextProps } from "./components/radio-text/props.ts";
export { default as ToggleInput } from "./components/toggle-input/ToggleInput.svelte";
export type { ToggleInputProps } from "./components/toggle-input/props.ts";
export { default as ToggleLabel } from "./components/toggle-label/ToggleLabel.svelte";
export type { ToggleLabelProps } from "./components/toggle-label/props.ts";
export { default as ToggleText } from "./components/toggle-text/ToggleText.svelte";
export type { ToggleTextProps } from "./components/toggle-text/props.ts";

export { default as Link } from "./components/link/Link.svelte";
export type { LinkProps } from "./components/link/props.ts";

export { default as ButtonInner } from "./components/button-inner/ButtonInner.svelte";
export type { ButtonInnerProps } from "./components/button-inner/props.ts";

export { default as Button } from "./components/button/Button.svelte";
export type { ButtonProps } from "./components/button/props.ts";
export { default as ButtonIcon } from "./components/button-icon/ButtonIcon.svelte";
export type { ButtonIconProps } from "./components/button-icon/props.ts";
export { default as Dropdown } from "./components/dropdown/Dropdown.svelte";
export type { DropdownProps } from "./components/dropdown/props.ts";
export { default as DropdownItemDefault } from "./components/dropdown-item-default/DropdownItemDefault.svelte";
export type { DropdownItemDefaultProps } from "./components/dropdown-item-default/props.ts";
export { dropdownBehavior } from "./behaviors/dropdown.ts";
export type { DropdownBehaviorOptions } from "./behaviors/dropdown.ts";
export { default as Tag } from "./components/tag/Tag.svelte";
export type { TagProps } from "./components/tag/props.ts";
export { default as TagInteractive } from "./components/tag-interactive/TagInteractive.svelte";
export type { TagInteractiveProps } from "./components/tag-interactive/props.ts";

export { default as DropdownItemCheckbox } from "./components/dropdown-item-checkbox/DropdownItemCheckbox.svelte";
export type { DropdownItemCheckboxProps } from "./components/dropdown-item-checkbox/props.ts";
export { default as DropdownItemToggle } from "./components/dropdown-item-toggle/DropdownItemToggle.svelte";
export type { DropdownItemToggleProps } from "./components/dropdown-item-toggle/props.ts";
export { dropdownControlsBehavior } from "./behaviors/dropdown-controls.ts";
export type { DropdownControlsBehaviorOptions } from "./behaviors/dropdown-controls.ts";

export { default as Select } from "./components/select/Select.svelte";
export type { SelectProps } from "./components/select/props.ts";

export { default as DropdownItemParent } from "./components/dropdown-item-parent/DropdownItemParent.svelte";
export type { DropdownItemParentProps } from "./components/dropdown-item-parent/props.ts";
export { dropdownNavigationBehavior } from "./behaviors/dropdown-navigation.ts";
export type { DropdownNavigationBehaviorOptions } from "./behaviors/dropdown-navigation.ts";

export { default as TableCellText } from "./components/table-cell-text/TableCellText.svelte";
export type { TableCellTextProps } from "./components/table-cell-text/props.ts";

export { default as TableCellHeading } from "./components/table-cell-heading/TableCellHeading.svelte";
export type { TableCellHeadingProps } from "./components/table-cell-heading/props.ts";

export { default as TableRowHead } from "./components/table-row-head/TableRowHead.svelte";
export type { TableRowHeadProps } from "./components/table-row-head/props.ts";

export { default as TableRowBody } from "./components/table-row-body/TableRowBody.svelte";
export type { TableRowBodyProps } from "./components/table-row-body/props.ts";

export { default as Modal } from "./components/modal/Modal.svelte";
export type { ModalProps } from "./components/modal/props.ts";

export { default as Drawer } from "./components/drawer/Drawer.svelte";
export type { DrawerProps } from "./components/drawer/props.ts";

export { default as Accordion } from "./components/accordion/Accordion.svelte";
export type { AccordionProps } from "./components/accordion/props.ts";

export { default as AccordionHeader } from "./components/accordion-header/AccordionHeader.svelte";
export type { AccordionHeaderProps } from "./components/accordion-header/props.ts";

export { default as AlertInline } from "./components/alert-inline/AlertInline.svelte";
export type { AlertInlineProps } from "./components/alert-inline/props.ts";

export { default as AlertPopup } from "./components/alert-popup/AlertPopup.svelte";
export type { AlertPopupProps } from "./components/alert-popup/props.ts";

export { default as AlertPopupTimer } from "./components/alert-popup-timer/AlertPopupTimer.svelte";
export type { AlertPopupTimerProps } from "./components/alert-popup-timer/props.ts";

export { default as InputSearch } from "./components/input-search/InputSearch.svelte";
export type { InputSearchProps } from "./components/input-search/props.ts";

export { default as ProgressBar } from "./components/progress-bar/ProgressBar.svelte";
export type { ProgressBarProps } from "./components/progress-bar/props.ts";

export { default as Switcher } from "./components/switcher/Switcher.svelte";
export type { SwitcherProps } from "./components/switcher/props.ts";

export { default as SwitcherItem } from "./components/switcher-item/SwitcherItem.svelte";
export type { SwitcherItemProps } from "./components/switcher-item/props.ts";

export { default as SwitcherItemIcon } from "./components/switcher-item-icon/SwitcherItemIcon.svelte";
export type { SwitcherItemIconProps } from "./components/switcher-item-icon/props.ts";

export { default as TabsHorizontal } from "./components/tabs-horizontal/TabsHorizontal.svelte";
export type { TabsHorizontalProps } from "./components/tabs-horizontal/props.ts";

export { default as TabItem } from "./components/tab-item/TabItem.svelte";
export type { TabItemProps } from "./components/tab-item/props.ts";

export { default as TabItemIcon } from "./components/tab-item-icon/TabItemIcon.svelte";
export type { TabItemIconProps } from "./components/tab-item-icon/props.ts";

export { default as TextArea } from "./components/text-area/TextArea.svelte";
export type { TextAreaProps } from "./components/text-area/props.ts";
export { tabsBehavior } from "./behaviors/tabs.ts";
export { switcherBehavior } from "./behaviors/switcher.ts";
