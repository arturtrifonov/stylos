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
export { default as ButtonBase } from "./components/button-base/ButtonBase.svelte";
export type { ButtonBaseProps } from "./components/button-base/props.ts";
export { default as ButtonOutline } from "./components/button-outline/ButtonOutline.svelte";
export type { ButtonOutlineProps } from "./components/button-outline/props.ts";
export { default as ButtonGhost } from "./components/button-ghost/ButtonGhost.svelte";
export type { ButtonGhostProps } from "./components/button-ghost/props.ts";
