// @stylos/ui — the public surface. One export per built component; the props
// types beside them are generated from the registry (tools/build-ui-types.mjs)
// and are re-exported so a consumer types against the contract, not a copy.
export { default as Badge } from "./components/badge/Badge.svelte";
export type { BadgeProps } from "./components/badge/props.ts";
export { default as Icon } from "./components/icon/Icon.svelte";
export type { IconProps } from "./components/icon/props.ts";
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
export { default as Tag } from "./components/tag/Tag.svelte";
export type { TagProps } from "./components/tag/props.ts";
export { default as TagInteractive } from "./components/tag-interactive/TagInteractive.svelte";
export type { TagInteractiveProps } from "./components/tag-interactive/props.ts";
