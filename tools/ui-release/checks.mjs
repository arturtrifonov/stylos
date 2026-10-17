export const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22a", "wcag22aa"];

export function hasLoadedFont(fonts, family) {
  return [...fonts].some(face => face.family.replace(/["']/g, "") === family && face.status === "loaded");
}

export async function settleAnimations(document, timeoutMs = 5000) {
  const finite = document.getAnimations().filter(animation =>
    animation.effect?.getComputedTiming().iterations !== Infinity && animation.playState !== "finished");
  let timeout;
  try {
    await Promise.race([
      Promise.all(finite.map(animation => animation.finished.catch(error => { if (error.name !== "AbortError") throw error; }))),
      new Promise((_, reject) => { timeout = setTimeout(() => reject(new Error("Surface animation did not settle")), timeoutMs); }),
    ]);
  } finally { clearTimeout(timeout); }
}

export function captureDiagnostics(window, console, record) {
  let context = { phase: "setup" };
  const describe = value => value instanceof Error ? `${value.message}\n${value.stack ?? ""}` : String(value);
  const error = event => record({ ...context, kind: "error", error: describe(event.error ?? event.message) });
  const rejection = event => record({ ...context, kind: "unhandledrejection", error: describe(event.reason) });
  window.addEventListener("error", error);
  window.addEventListener("unhandledrejection", rejection);
  const original = { warn: console.warn, error: console.error };
  for (const level of ["warn", "error"]) console[level] = (...args) => {
    record({ ...context, kind: `console.${level}`, error: args.map(describe).join(" ") });
    original[level].apply(console, args);
  };
  return {
    context(next) { context = next; },
    stop() {
      window.removeEventListener("error", error);
      window.removeEventListener("unhandledrejection", rejection);
      Object.assign(console, original);
    },
  };
}

export function verifyVariantCase(component, args, read) {
  const className = component.selector.slice(1);
  if (read(className) === undefined) throw new Error("component root class is absent");
  for (const check of component.variantChecks) {
    let expected = args[check.prop];
    if (check.prop === "sortDirection" && !args.isSorted) expected = null;
    if (check.prop === "validation" && ["Input Text", "Select", "Input Search", "Text Area"].includes(component.id) && args.state !== "default") expected = "off";
    if (check.prop === "interaction") expected = expected === "option" ? "option" : null;
    const actual = read(check.className, check.attribute);
    if (actual !== expected) throw new Error(`${check.prop}: expected ${expected}, received ${actual}`);
  }
}
