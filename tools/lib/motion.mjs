// The export uses objects; the canonical YAML reader uses Maps.
export function cssDuration(value) {
  const amount = value instanceof Map ? value.get("value") : value?.value;
  const unit = value instanceof Map ? value.get("unit") : value?.unit;
  if (!Number.isFinite(amount) || amount < 0 || !["ms", "s"].includes(unit)) {
    throw new Error("duration must have a non-negative finite value and an ms or s unit");
  }
  return `${amount}${unit}`;
}

export function cssEasing(value) {
  if (value === "linear") return value;
  const match = typeof value === "string" && value.match(/^cubic-bezier\(\s*([^()]+)\s*\)$/);
  const points = match ? match[1].split(",").map((point) => point.trim()) : [];
  const number = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i;
  if (points.length !== 4 || points.some((point) => !number.test(point) || !Number.isFinite(Number(point))) ||
      [Number(points[0]), Number(points[2])].some((x) => x < 0 || x > 1)) {
    throw new Error("easing must be linear or a cubic-bezier with four finite coordinates and x coordinates in [0, 1]");
  }
  return value;
}
