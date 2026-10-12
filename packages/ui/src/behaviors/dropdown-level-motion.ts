// FND-MOTION-08/10/11/13/15: direction explains descent and return.
// The current level slides out before the next slides in, over one surface.
export function dropdownLevelMotion(container: HTMLElement, panels: HTMLElement[]) {
  const view = container.ownerDocument.defaultView!;
  const preference = view.matchMedia("(prefers-reduced-motion: reduce)");
  const animations = new Map<HTMLElement, { animation: Animation; delay: number }>();
  let heightMotion: Animation | undefined;
  let active = panels[0];
  const attributes = ["data-navigation-leaving", "inert", "aria-hidden"];
  const originals = new Map(panels.map(panel => [panel,
    new Map(attributes.map(name => [name, panel.getAttribute(name)]))]));

  function restore(panel: HTMLElement) {
    for (const [name, value] of originals.get(panel)!) {
      if (value === null) panel.removeAttribute(name);
      else panel.setAttribute(name, value);
    }
  }
  function cancel() {
    animations.forEach(({ animation }) => { animation.onfinish = null; animation.cancel(); });
    animations.clear();
    if (heightMotion) { heightMotion.onfinish = null; heightMotion.cancel(); heightMotion = undefined; }
  }
  function settle(panel: HTMLElement) {
    active = panel;
    cancel();
    panels.forEach(level => { level.hidden = level !== active; restore(level); });
  }
  const onPreference = () => { if (preference.matches) settle(active); };
  preference.addEventListener("change", onPreference);

  return {
    show(panel: HTMLElement, direction?: 1 | -1) {
      if (!direction || preference.matches || typeof panel.animate !== "function" || active === panel) {
        settle(panel); return;
      }
      const style = view.getComputedStyle(container);
      const token = (name: string) => style.getPropertyValue(`--stylos-${name}`).trim();
      const milliseconds = (value: string) => Number.parseFloat(value) * (value.endsWith("ms") ? 1 : 1000);
      const enter = milliseconds(token("motion-duration-medium-enter"));
      const exit = milliseconds(token("motion-duration-medium-exit"));
      const travel = `${100 * direction}%`;
      const fromHeight = Number.parseFloat(style.height);
      // Read every presented level before cancelling. A fast Back can target
      // a level that is still leaving; continue its actual travel immediately.
      const presented = panels.filter(level => !level.hidden || level === panel).map(level => {
        const current = view.getComputedStyle(level);
        const running = animations.get(level);
        const presented = !level.hidden && (!running || Number(running.animation.currentTime ?? 0) >= running.delay);
        return { level, presented, transform: level.hidden ? `translateX(${travel})` : current.transform };
      }).filter(entry => entry.presented || entry.level === panel);
      cancel();
      active = panel;
      panels.forEach(level => {
        level.hidden = !presented.some(entry => entry.level === level);
        restore(level);
      });
      presented.forEach(({ level }) => {
        level.hidden = false;
        restore(level);
        if (level !== active) {
          level.setAttribute("data-navigation-leaving", "");
          level.setAttribute("inert", "");
          level.setAttribute("aria-hidden", "true");
        }
      });
      const toHeight = Number.parseFloat(view.getComputedStyle(panel).height);
      const arrivalDelay = presented.find(entry => entry.level === active)!.presented ? 0 : exit;
      for (const { level, transform } of presented) {
        const arriving = level === active;
        const animation = level.animate([
          { transform },
          { transform: arriving ? "none" : `translateX(${-100 * direction}%)` },
        ], { duration: arriving ? enter : exit, delay: arriving ? arrivalDelay : 0,
          easing: token(`motion-easing-${arriving ? "enter" : "exit"}`), fill: "both" });
        animations.set(level, { animation, delay: arriving ? arrivalDelay : 0 });
        animation.onfinish = () => {
          if (animations.get(level)?.animation !== animation) return;
          animations.delete(level);
          level.hidden = level !== active;
          restore(level);
          animation.cancel();
        };
      }
      if (fromHeight !== toHeight) {
        const shrinking = toHeight < fromHeight;
        const animation = container.animate([{ height: `${fromHeight}px` }, { height: `${toHeight}px` }], {
          duration: shrinking ? exit : enter, delay: arrivalDelay,
          easing: token(`motion-easing-${shrinking ? "exit" : "enter"}`), fill: "both",
        });
        heightMotion = animation;
        animation.onfinish = () => {
          if (heightMotion !== animation) return;
          heightMotion = undefined;
          animation.cancel();
        };
      }
    },
    destroy() {
      preference.removeEventListener("change", onPreference);
      cancel();
      panels.forEach(restore);
    },
  };
}
