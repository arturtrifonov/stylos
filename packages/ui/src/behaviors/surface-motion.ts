// FND-LAYERS-04, FND-MOTION-19/18. Call update before applying visibility.
// The positioner can own opacity while an inner surface owns spatial motion.
export function surfaceMotion(surface: HTMLElement, visibilitySurface = surface) {
  const view = surface.ownerDocument.defaultView!;
  const reducedMotion = view.matchMedia("(prefers-reduced-motion: reduce)");
  const originalTransform = surface.style.transform;
  const originalMarker = visibilitySurface.getAttribute("data-surface-motion");
  const visibilityParameters = ["enter-duration", "exit-duration", "enter-easing", "exit-easing"];
  const originalParameters = new Map(visibilityParameters.map(name => {
    const property = `--_stylos-surface-${name}`;
    return [property, [visibilitySurface.style.getPropertyValue(property), visibilitySurface.style.getPropertyPriority(property)]];
  }));
  visibilitySurface.setAttribute("data-surface-motion", "");
  let motionOpen = false;
  let spatialMotion: Animation | undefined;
  const stop = () => {
    spatialMotion?.cancel();
    spatialMotion = undefined;
    surface.style.transform = originalTransform;
  };
  const onPreference = () => {
    if (reducedMotion.matches) stop();
  };
  reducedMotion.addEventListener("change", onPreference);

  return {
    update(open: boolean) {
      if (open === motionOpen) return;
      motionOpen = open;
      const style = view.getComputedStyle(surface);
      const parameter = (name: string) => style.getPropertyValue(`--_stylos-surface-${name}`).trim();
      if (visibilitySurface !== surface) {
        for (const name of visibilityParameters) {
          visibilitySurface.style.setProperty(`--_stylos-surface-${name}`, parameter(name));
        }
      }
      const current = spatialMotion ? style.transform : originalTransform || "none";
      const compose = (transform: string) => transform && transform !== "none"
        ? `${transform}${originalTransform ? ` ${originalTransform}` : ""}` : originalTransform || "none";
      if (reducedMotion.matches) { stop(); return; }
      if (!open) {
        // Free/control-attached surfaces fade at their current geometry.
        // Window-edge profiles instead translate back to their edge.
        const exit = parameter("exit-transform");
        stop();
        if (!exit || exit === "none") {
          surface.style.transform = current === "none" ? originalTransform : current;
          return;
        }
        spatialMotion = surface.animate([{ transform: current }, { transform: compose(exit) }], {
          duration: milliseconds(parameter("exit-duration")), easing: parameter("exit-easing"), fill: "forwards",
        });
      } else {
        const visibility = view.getComputedStyle(visibilitySurface);
        const continuing = visibility.visibility === "visible" && Number(visibility.opacity) > 0;
        const from = continuing ? style.transform : compose(parameter("enter-transform"));
        const to = originalTransform || "none";
        stop();
        if (from === to) return;
        spatialMotion = surface.animate([{ transform: from }, { transform: to }], {
          duration: milliseconds(parameter("enter-duration")), easing: parameter("enter-easing"),
        });
      }
    },
    destroy() {
      reducedMotion.removeEventListener("change", onPreference);
      stop();
      if (originalMarker === null) visibilitySurface.removeAttribute("data-surface-motion");
      else visibilitySurface.setAttribute("data-surface-motion", originalMarker);
      if (visibilitySurface !== surface) {
        for (const [property, [value, priority]] of originalParameters) {
          if (value) visibilitySurface.style.setProperty(property, value, priority);
          else visibilitySurface.style.removeProperty(property);
        }
      }
    },
  };
}

function milliseconds(duration: string) {
  return Number.parseFloat(duration) * (duration.endsWith("ms") ? 1 : 1000);
}
