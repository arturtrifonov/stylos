// Measure the decorative groups so the field control can cover the entire
// field while its text padding leaves room for icons and variable-width units.
// Geometry and gaps still come from the component's token-based stylesheet.
export function inputTextBehavior(field: HTMLElement) {
  let groups: (HTMLElement | null)[] = [];
  const properties = ["--_stylos-input-leading-reserve", "--_stylos-input-trailing-reserve"];
  function measure() {
    groups.forEach((group, index) => {
      const width = group?.getBoundingClientRect().width ?? 0;
      const gap = group ? parseFloat(getComputedStyle(group).columnGap) || 0 : 0;
      const reserve = width > 0 ? width + gap : 0;
      const property = properties[index];
      const value = `${reserve}px`;
      if (field.style.getPropertyValue(property) !== value) field.style.setProperty(property, value);
    });
  }
  const observer = new ResizeObserver(measure);
  function update() {
    observer.disconnect();
    groups = [
      field.querySelector<HTMLElement>(".stylos-input-text-leading, .stylos-select-leading, .stylos-input-search-leading, .stylos-text-area-leading"),
      field.querySelector<HTMLElement>(".stylos-input-text-trailing, .stylos-select-trailing, .stylos-input-search-trailing, .stylos-text-area-trailing"),
    ];
    groups.forEach(group => { if (group) observer.observe(group); });
    measure();
  }
  update();
  return { update, destroy() {
    observer.disconnect();
    properties.forEach(property => field.style.removeProperty(property));
  } };
}
