import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "public", "images");
mkdirSync(OUT, { recursive: true });

let seed = 123456789;
function rng() {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
}
function rand(min, max) {
  return min + rng() * (max - min);
}

const PALETTES = [
  { bg: ["#FAF6EF", "#F1E9DC"], fold: ["#E9DFCD", "#D9CBB2"], accent: "#B9975B", deep: "#5A4632", stripe: "#C9B88F" },
  { bg: ["#FBF6F0", "#F0E3D4"], fold: ["#E7D3BE", "#D5B9A0"], accent: "#A87B4F", deep: "#4E3A2B", stripe: "#C2A181" },
  { bg: ["#F5F0E8", "#E7DCC9"], fold: ["#D8C6A8", "#C2AC86"], accent: "#8C6D3F", deep: "#3B3022", stripe: "#B09B72" },
  { bg: ["#F9F5F1", "#EFE2E0"], fold: ["#E2C9C6", "#CFAEA9"], accent: "#A8737A", deep: "#4A3438", stripe: "#C29A9C" },
  { bg: ["#F6F3EF", "#E4E0D6"], fold: ["#C9C2B2", "#ABA290"], accent: "#8A7B5C", deep: "#34312A", stripe: "#9C917A" },
  { bg: ["#FBF7F2", "#EFE2CF"], fold: ["#DFC59E", "#C7A473"], accent: "#9A6B2E", deep: "#46351F", stripe: "#BD945A" },
  { bg: ["#F6F1E9", "#E5D5C3"], fold: ["#D3BFA8", "#B99E84"], accent: "#A4763F", deep: "#3F3227", stripe: "#C0A583" },
  { bg: ["#F8F4F0", "#EADCD3"], fold: ["#D8BEA9", "#BC9C82"], accent: "#96785C", deep: "#413430", stripe: "#C7A88B" },
];

function motifs(w, h, seedOffset, palette) {
  const parts = [];
  const count = Math.floor(rand(8, 16));
  for (let i = 0; i < count; i++) {
    const x = rand(0, w);
    const y = rand(0, h);
    const s = rand(0.5, 1.4);
    const op = rand(0.04, 0.14);
    const shape = rng() > 0.5 ? "petal" : "dot";
    if (shape === "dot") {
      parts.push(`<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(2.5 * s).toFixed(1)}" fill="${palette.accent}" opacity="${op.toFixed(2)}"/>`);
    } else {
      parts.push(`<g transform="translate(${x.toFixed(0)} ${y.toFixed(0)}) rotate(${rand(0, 180).toFixed(0)}) scale(${s.toFixed(2)})" opacity="${op.toFixed(2)}">
        <path d="M0,-14 C9,-7 9,7 0,14 C-9,7 -9,-7 0,-14 Z" fill="${palette.accent}"/>
      </g>`);
    }
  }
  return parts.join("\n    ");
}

function drape(w, h, palette, variant) {
  const parts = [];
  const layers = variant % 3 + 2;
  for (let i = 0; i < layers; i++) {
    const y = (h / (layers + 1)) * (i + 1);
    const amp = rand(h * 0.06, h * 0.12);
    const span = rand(w * 0.5, w * 1.6);
    const cx = w / 2 + rand(-w * 0.12, w * 0.12);
    const op = rand(0.16, 0.34);
    const fill = i % 2 === 0 ? palette.fold[0] : palette.fold[1];
    const d = `M${(cx - span / 2).toFixed(0)},${y.toFixed(0)} C${(cx - span / 4).toFixed(0)},${(y - amp).toFixed(0)} ${(cx + span / 4).toFixed(0)},${(y - amp).toFixed(0)} ${(cx + span / 2).toFixed(0)},${y.toFixed(0)} C${(cx + span / 4).toFixed(0)},${(y + amp * 0.6).toFixed(0)} ${(cx - span / 4).toFixed(0)},${(y + amp * 0.6).toFixed(0)} ${(cx - span / 2).toFixed(0)},${y.toFixed(0)} Z`;
    parts.push(`<path d="${d}" fill="${fill}" opacity="${op.toFixed(2)}"/>`);
  }
  if (variant % 4 === 0) {
    const y = h * rand(0.25, 0.75);
    parts.push(`<rect x="0" y="${y.toFixed(0)}" width="${w}" height="${h * 0.09}" fill="url(#band)" opacity="0.5"/>`);
  }
  return parts.join("\n    ");
}

function render(w, h, palette, variant) {
  const bands = [];
  for (let i = 0; i < 8; i++) {
    bands.push(`${palette.stripe}`);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${palette.bg[0]}"/>
      <stop offset="1" stop-color="${palette.bg[1]}"/>
    </linearGradient>
    <linearGradient id="band" x1="0" y1="0" x2="1" y2="0">
      ${bands.map((c, i) => `<stop offset="${(i / bands.length) * 100}%" stop-color="${c}"/>`).join("\n      ")}
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="${palette.accent}" stop-opacity="0.16"/>
      <stop offset="1" stop-color="${palette.accent}" stop-opacity="0"/>
    </radialGradient>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="${Math.floor(rand(1, 99))}"/>
      <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.4 0"/>
    </filter>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  <rect width="${w}" height="${h}" fill="url(#glow)"/>
  <circle cx="${(w * 0.8).toFixed(0)}" cy="${(h * 0.2).toFixed(0)}" r="${(w * 0.18).toFixed(0)}" fill="url(#glow)"/>
  ${drape(w, h, palette, variant)}
  ${motifs(w, h, variant, palette)}
  <path d="M${(w * 0.06).toFixed(0)},${(h * 0.94).toFixed(0)} L${(w * 0.94).toFixed(0)},${(h * 0.94).toFixed(0)}" stroke="${palette.accent}" stroke-width="1.5" opacity="0.5" fill="none"/>
  <path d="M${(w * 0.06).toFixed(0)},${(h * 0.94).toFixed(0)} L${(w * 0.06).toFixed(0)},${(h * 0.885).toFixed(0)}" stroke="${palette.accent}" stroke-width="1.5" opacity="0.5" fill="none"/>
  <rect width="${w}" height="${h}" filter="url(#grain)" opacity="0.55"/>
</svg>`;
}

const files = [];

function add(name, w, h, variant) {
  const palette = PALETTES[variant % PALETTES.length];
  files.push({ name, w, h, variant, palette });
}

add("hero-landscape", 1600, 1100, 0);
add("hero-landscape-2", 1600, 1100, 6);

add("category-saree", 900, 1200, 0);
add("category-chudithar", 900, 1200, 1);
add("category-blouse", 900, 1200, 7);

add("collection-wedding", 1200, 1500, 2);
add("collection-festive", 1200, 1500, 1);
add("collection-everyday", 1200, 1500, 3);
add("collection-bridal", 1200, 1500, 0);

add("about-hero", 1600, 1000, 4);
add("about-story", 1200, 1500, 5);
add("about-craft", 1200, 1500, 6);
add("about-philosophy", 1200, 1500, 7);
add("brand-story", 1400, 1500, 2);
add("custom-blouse-feature", 1200, 1500, 7);
add("newsletter-bg", 1600, 900, 4);

const productNames = [
  "banarasi-silk", "kanjivaram-silk", "chanderi-saree", "cotton-saree",
  "organza-saree", "georgette-saree", "tussar-saree", "bandhani-saree",
  "chudithar-kurti", "palazzo-chudithar", "silk-chudithar", "cotton-chudithar",
  "anarkali-chudithar", "linen-chudithar", "work-chudithar", "printed-chudithar",
];
productNames.forEach((name, i) => {
  add(`p-${name}`, 900, 1125, i);
  add(`p-${name}-b`, 900, 1125, i + 3);
});

for (let i = 1; i <= 6; i++) add(`lookbook-0${i}`, i % 2 ? 1200 : 1000, i % 2 ? 1500 : 1300, i);
for (let i = 1; i <= 6; i++) add(`instagram-0${i}`, 800, 800, i + 2);

for (let i = 1; i <= 4; i++) add(`avatar-0${i}`, 200, 200, i * 2);

add("blouse-neck", 900, 700, 1);
add("blouse-sleeve", 900, 700, 2);
add("blouse-back", 900, 700, 3);
add("blouse-embroidery", 900, 700, 4);
add("blouse-border", 900, 700, 5);
add("blouse-stitch", 900, 700, 6);
add("blouse-hero", 1200, 900, 7);
add("size-guide", 1000, 700, 5);

for (const f of files) {
  const out = join(OUT, `${f.name}.svg`);
  writeFileSync(out, render(f.w, f.h, f.palette, f.variant), "utf8");
  console.log("wrote", out);
}
console.log("Total images:", files.length);
