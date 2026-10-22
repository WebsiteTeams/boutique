/**
 * Writes one SVG illustration per custom-blouse option to
 * public/images/customization/<group>/<option>.svg.
 *
 * The drawings live in src/lib/blouse-art.ts — edit them there and re-run:
 * npm run assets:blouse
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { customizationGroups } from "../src/lib/data";
import { measurementGuideSvg, optionArtSvg } from "../src/lib/blouse-art";

const OUT = join(process.cwd(), "public", "images", "customization");

let count = 0;
for (const group of customizationGroups) {
  const dir = join(OUT, group.id);
  mkdirSync(dir, { recursive: true });
  for (const option of group.options) {
    writeFileSync(join(dir, `${option.id}.svg`), optionArtSvg(group.id, option.id) + "\n");
    count++;
  }
}

console.log(`Wrote ${count} blouse option illustrations to ${OUT}`);

writeFileSync(
  join(process.cwd(), "public", "images", "custom-blouse", "size-guide.svg"),
  measurementGuideSvg() + "\n"
);
console.log("Wrote measurement guide to public/images/custom-blouse/size-guide.svg");
