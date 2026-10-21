// The marks `<Icon name>` can resolve — docs/foundations/icons.md.
//
// The preset's whole catalogue is generated (tools/build-ui-icons.mjs), one
// module per mark under @stylos/ui/icons/<name>, so a bundle carries only the
// marks something imports. A name resolves once its mark is registered:
//
//   import { registerIcons } from "@stylos/ui";
//   import rocketLaunch from "@stylos/ui/icons/rocket_launch";
//   registerIcons(rocketLaunch);
//
// The registered marks in assets/icons/manifest.yaml resolve from the start,
// because the components render them without being asked. Registering is
// reactive, so an Icon already on screen draws its mark once it arrives — a
// lazily loaded route may register what it uses.
import { SvelteMap } from "svelte/reactivity";
import { icons, type IconDrawing } from "./icons.ts";

/** A mark from @stylos/ui/icons/<name>: its drawing, and the name it answers to. */
export type RegisteredIcon = IconDrawing & { name: string };

const registry = new SvelteMap<string, IconDrawing>(Object.entries(icons));

/**
 * Makes each mark resolvable by its name. Pass the modules imported from
 * @stylos/ui/icons — a drawing from anywhere else is another preset, which
 * FND-ICONS-05 leaves to whoever chooses it.
 */
export function registerIcons(...marks: RegisteredIcon[]): void {
  for (const { name, viewBox, paths } of marks) registry.set(name, { viewBox, paths });
}

/** The drawing for a name, or undefined — which Icon renders as nothing (FND-ICONS-13). */
export function resolveIcon(name: string): IconDrawing | undefined {
  return registry.get(name);
}
