import { readFileSync } from "node:fs";
import path from "node:path";

// Keep independent CSS and documentation previews self-contained. SVG masks
// are embedded byte-for-byte as URLs; their geometry is never rewritten.
export function componentCss(root, slug) {
  const dir = path.join(root, "packages/ui/src/components", slug);
  return readFileSync(path.join(dir, `${path.basename(slug)}.css`), "utf8")
    .replace(/url\("(\.\/assets\/[^"\n]+\.svg)"\)/g, (_, asset) => {
      const svg = readFileSync(path.join(dir, asset), "utf8");
      return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
    });
}
