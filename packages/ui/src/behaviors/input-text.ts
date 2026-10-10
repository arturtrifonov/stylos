// Measure the decorative groups so the native input can cover the entire
// field while its text padding leaves room for icons and variable-width units.
// Geometry and gaps still come from the component's token-based stylesheet.
export function inputTextBehavior(field: HTMLElement) {
  const groups = [
    field.querySelector<HTMLElement>(".stylos-input-text-leading"),
    field.querySelector<HTMLElement>(".stylos-input-text-trailing"),
  ];
  function measure() {
    groups.forEach((group, index) => {
      if (!group) return;
      const width = group.getBoundingClientRect().width;
      const gap = parseFloat(getComputedStyle(group).columnGap) || 0;
      const reserve = width > 0 ? width + gap : 0;
      const property = `--_stylos-input-${index === 0 ? "leading" : "trailing"}-reserve`;
      const value = `${reserve}px`;
      if (field.style.getPropertyValue(property) !== value) field.style.setProperty(property, value);
    });
  }
  const observer = new ResizeObserver(measure);
  groups.forEach(group => { if (group) observer.observe(group); });
  measure();
  return { destroy() { observer.disconnect(); } };
}
