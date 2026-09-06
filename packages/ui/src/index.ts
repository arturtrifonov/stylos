// @stylos/ui — the public surface. One export per built component; the props
// types beside them are generated from the registry (tools/build-ui-types.mjs)
// and are re-exported so a consumer types against the contract, not a copy.
export { default as Badge } from "./components/badge/Badge.svelte";
export type { BadgeProps } from "./components/badge/props.ts";
export { default as IndicatorSpecial } from "./components/indicator-special/IndicatorSpecial.svelte";
export type { IndicatorSpecialProps } from "./components/indicator-special/props.ts";
export { default as IndicatorStatus } from "./components/indicator-status/IndicatorStatus.svelte";
export type { IndicatorStatusProps } from "./components/indicator-status/props.ts";
export { default as Label } from "./components/label/Label.svelte";
export type { LabelProps } from "./components/label/props.ts";
export { default as Loader } from "./components/loader/Loader.svelte";
export type { LoaderProps } from "./components/loader/props.ts";
