/**
 * Technical-flat line drawings of the bespoke blouse.
 *
 * One source for both the per-option thumbnails (written to
 * public/images/customization/<group>/<option>.svg by
 * `npm run assets:blouse`) and the live preview in the builder.
 * Everything is drawn on a 120×120 grid; the left sleeve is drawn once
 * and mirrored for the right.
 */

const INK = "#1c1a17";
const GOLD = "#a47a45";
const GOLD_DEEP = "#7e5a2a";
const GOLD_SOFT = "#c9ac7c";
const FABRIC = "#fbf8f3";
const TINT = "#f1e4cf";

type Pt = [number, number];
export type BlouseView = "front" | "back";

export interface BlouseArtOptions {
  view: BlouseView;
  neck?: string;
  sleeve?: string;
  back?: string;
  embroidery?: string;
  border?: string;
  stitching?: string;
  /** Customization group drawn in gold to call it out. */
  focus?: string;
}

/* ---------- Necklines: path segments from the right neck point (74,24) to the left (46,24) ---------- */

const FRONT_NECKS: Record<string, string> = {
  sweetheart: "C75,42 66,50 60,40 C54,50 45,42 46,24",
  boat: "Q60,29 46,24",
  square: "L73,40 L47,40 L46,24",
  "v-neck": "L60,48 L46,24",
  high: "Q60,27 46,24",
  jewel: "C73,35 47,35 46,24",
};

interface BackStyle {
  neck: string;
  /** Closed shapes cut out of the back panel. */
  holes?: string;
  /** Extra detail drawn on top (collars, ties). */
  extra?: (stroke: string) => string;
  /** Where the centre-back closure begins. */
  closureTop: number;
}

const COLLAR = "M46,24 L47,15 Q60,13 73,15 L74,24 Q60,27 46,24 Z";

const BACK_STYLES: Record<string, BackStyle> = {
  "u-back": { neck: "C74,54 46,54 46,24", closureTop: 47 },
  "v-back": { neck: "L60,58 L46,24", closureTop: 58 },
  deep: { neck: "C74,76 46,76 46,24", closureTop: 63 },
  keyhole: {
    neck: "Q60,30 46,24",
    holes: "M60,31 C69,38 67,54 60,56 C53,54 51,38 60,31 Z",
    extra: (s) => `<circle cx="60" cy="28.5" r="1.4" fill="${s}"/>`,
    closureTop: 56,
  },
  tassel: {
    neck: "C74,48 46,48 46,24",
    extra: (s) =>
      `<path d="M69,38 Q64,44 60,44 Q56,44 51,38 M60,44 Q58,55 56,63 M60,44 Q62,57 64,65" fill="none" stroke="${s}" stroke-width="1.2" stroke-linecap="round"/>` +
      `<path d="M56,62.5 L53.6,70 L58.4,70 Z M64,64.5 L61.6,72 L66.4,72 Z" fill="${s}"/>` +
      `<circle cx="60" cy="44" r="1.6" fill="${s}"/>`,
    closureTop: 46,
  },
  cutout: {
    neck: "Q60,27 46,24",
    holes: "M60,32 C75,32 76,58 60,62 C44,58 45,32 60,32 Z",
    extra: (s) => `<path d="${COLLAR}" fill="${FABRIC}" stroke="${s}" stroke-width="1.6" stroke-linejoin="round"/>`,
    closureTop: 62,
  },
  /** Plain back used to show off the stitching style. */
  plain: { neck: "C74,40 46,40 46,24", closureTop: 36 },
};

/* ---------- Sleeves (left side) ---------- */

interface Sleeve {
  path: string;
  /** Cuff edge: outer and inner hem points. */
  hem: [Pt, Pt];
  extra?: string;
}

const SLEEVES: Record<string, Sleeve> = {
  cap: { path: "M30,30 Q21,33 20,42 L28,46 L33,47 Z", hem: [[20, 42], [28, 46]] },
  short: { path: "M30,30 L19,45 L28,51 L36,52 Z", hem: [[19, 45], [28, 51]] },
  elbow: { path: "M30,30 L12,62 L23,67 L36,52 Z", hem: [[12, 62], [23, 67]] },
  "34": { path: "M30,30 L8,76 L19,80 L36,52 Z", hem: [[8, 76], [19, 80]] },
  full: { path: "M30,30 L5,94 L15,97 L36,52 Z", hem: [[5, 94], [15, 97]] },
  balloon: {
    path: "M30,30 C12,27 1,50 13,63 L24,67 C31,61 34,56 36,52 Z",
    hem: [[13, 63], [24, 67]],
    extra: "M16,58 Q14,48 19,38 M20,61 Q20,50 25,40",
  },
};

/** Cropped, fitted saree-blouse body: ends at the under-bust band, not the hip. */
const BODY_OUTLINE = "M46,24 L30,30 C32,40 34,47 36,52 C34.6,57 34.6,62 36,66 L39,78 Q60,84 81,78 L84,66 C85.4,62 85.4,57 84,52 C86,47 88,40 90,30 L74,24";
const HEM_BAND = "M38,72.5 Q60,78.5 82,72.5 L81,78 Q60,84 39,78 Z";
/** Under-bust band seam and bust darts. */
const BODICE_LINES = "M38,72.5 Q60,78.5 82,72.5 M47,74.5 L50,62 M73,74.5 L70,62";
const MIRROR = 'transform="translate(120,0) scale(-1,1)"';

/** A band running from the cuff edge back up the sleeve. */
function cuffBand([a, b]: [Pt, Pt], depth = 5): string {
  const mx = (a[0] + b[0]) / 2;
  const my = (a[1] + b[1]) / 2;
  const len = Math.hypot(30 - mx, 30 - my);
  const ux = ((30 - mx) / len) * depth;
  const uy = ((30 - my) / len) * depth;
  const f = (n: number) => n.toFixed(1);
  return `M${a[0]},${a[1]} L${b[0]},${b[1]} L${f(b[0] + ux)},${f(b[1] + uy)} L${f(a[0] + ux)},${f(a[1] + uy)} Z`;
}

/* ---------- Surface details ---------- */

const SEQUINS: Pt[] = [
  [44, 44], [52, 50], [68, 50], [76, 44], [46, 55], [56, 56], [64, 58], [74, 55],
  [41, 63], [51, 63], [60, 65], [69, 63], [79, 63], [44, 70], [54, 70], [66, 70],
  [76, 70], [48, 76.5], [60, 78.5], [72, 76.5], [38.5, 56], [81.5, 56],
];

const diamond = ([x, y]: Pt, r = 2) => `M${x},${y - r} L${x + r},${y} L${x},${y + r} L${x - r},${y} Z`;
const flower = ([x, y]: Pt, s: string) =>
  [0, 72, 144, 216, 288]
    .map((deg) => {
      const rad = (deg * Math.PI) / 180;
      return `<circle cx="${(x + Math.cos(rad) * 2.2).toFixed(1)}" cy="${(y + Math.sin(rad) * 2.2).toFixed(1)}" r="1.3" fill="none" stroke="${s}" stroke-width="0.8"/>`;
    })
    .join("") + `<circle cx="${x}" cy="${y}" r="0.9" fill="${s}"/>`;

function embroideryArt(id: string | undefined): string {
  switch (id) {
    case "thread":
      return (
        `<path d="M41,77 q3,-3 6.3,0 t6.3,0 t6.3,0 t6.3,0 t6.3,0 t6.3,0" fill="none" stroke="${GOLD}" stroke-width="1" stroke-linecap="round"/>` +
        `<path d="M46,44 q4,6 2,13 M74,44 q-4,6 -2,13" fill="none" stroke="${GOLD}" stroke-width="0.9" stroke-linecap="round"/>` +
        flower([46, 44], GOLD) + flower([74, 44], GOLD) + flower([60, 64], GOLD)
      );
    case "sequin":
      return SEQUINS.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.25" fill="${GOLD}"/>`).join("");
    case "zardozi":
      return (
        `<path d="M60,52 c7,0 9,9 4,13 c-4,3 -10,2 -10,-3 c0,-5 4,-5 6,-10 z" fill="${GOLD}" stroke="${GOLD_DEEP}" stroke-width="0.8"/>` +
        `<circle cx="59.5" cy="61.5" r="2" fill="${FABRIC}"/><circle cx="59.5" cy="61.5" r="0.9" fill="${GOLD_DEEP}"/>` +
        `<path d="M46,58 c4,0 5,5 2,7 c-2,2 -5,1 -5,-2 c0,-3 2,-3 3,-5 z M74,58 c-4,0 -5,5 -2,7 c2,2 5,1 5,-2 c0,-3 -2,-3 -3,-5 z" fill="${GOLD}"/>` +
        `<path d="M39.5,75.5 Q60,81.5 80.5,75.5" fill="none" stroke="${GOLD_DEEP}" stroke-width="2.4"/>` +
        [42, 48, 54, 60, 66, 72, 78].map((x) => `<circle cx="${x}" cy="${(72.6 + 6 * (1 - ((x - 60) / 21) ** 2)).toFixed(1)}" r="1.1" fill="${GOLD_SOFT}"/>`).join("")
      );
    case "stone":
      return (
        [[50, 42], [55, 45.5], [65, 45.5], [70, 42], [60, 41.5]]
          .map((p) => `<path d="${diamond(p as Pt, 1.8)}" fill="${TINT}" stroke="${GOLD}" stroke-width="0.9"/>`)
          .join("") +
        `<path d="${diamond([60, 60], 4)}" fill="${GOLD_SOFT}" stroke="${GOLD_DEEP}" stroke-width="1"/>` +
        [[54, 60], [66, 60], [60, 54], [60, 66]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.3" fill="${GOLD}"/>`).join("")
      );
    default:
      return "";
  }
}

/** Centre-front hem curve height at x (quadratic from 39,78 via 60,84 to 81,78). */
const hemY = (x: number) => {
  const t = (x - 39) / 42;
  return 78 + 12 * t * (1 - t);
};

const zigzag = () => {
  let d = "M40,76";
  for (let x = 40, up = true; x < 80; x += 3, up = !up) d += ` L${x + 3},${(hemY(x + 3) - (up ? 4.2 : 1.6)).toFixed(1)}`;
  return d;
};

function borderArt(id: string | undefined, sleeve: Sleeve): string {
  if (!id || id === "none-bor") return "";
  const cuff = cuffBand(sleeve.hem);
  const bands = (fill: string, stroke: string) =>
    `<path d="${HEM_BAND}" fill="${fill}" stroke="${stroke}" stroke-width="0.9"/>` +
    `<g><path d="${cuff}" fill="${fill}" stroke="${stroke}" stroke-width="0.9"/></g>` +
    `<g ${MIRROR}><path d="${cuff}" fill="${fill}" stroke="${stroke}" stroke-width="0.9"/></g>`;

  switch (id) {
    case "contrast":
      return bands(GOLD, GOLD_DEEP);
    case "zari":
      return (
        bands(GOLD_SOFT, GOLD_DEEP) +
        `<path d="${zigzag()}" fill="none" stroke="${GOLD_DEEP}" stroke-width="0.8"/>`
      );
    case "pearl": {
      const pearls = (pts: Pt[]) =>
        pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.5" fill="#fff" stroke="${GOLD}" stroke-width="0.8"/>`).join("");
      const [a, b] = sleeve.hem;
      const cuffPearls = [0.15, 0.5, 0.85].map((t) => [+(a[0] + (b[0] - a[0]) * t).toFixed(1), +(a[1] + (b[1] - a[1]) * t).toFixed(1)] as Pt);
      const hem: Pt[] = [];
      for (let x = 41; x <= 79; x += 3.8) {
        hem.push([+x.toFixed(1), +(hemY(x) - 1.6).toFixed(1)]);
      }
      return pearls(hem) + pearls(cuffPearls) + `<g ${MIRROR}>${pearls(cuffPearls)}</g>`;
    }
    default:
      return "";
  }
}

function closureArt(id: string | undefined, top: number, s: string): string {
  const bottom = 80;
  const steps = (gap: number, offset = 3) => {
    const ys: number[] = [];
    for (let y = top + offset; y <= bottom - 2; y += gap) ys.push(+y.toFixed(1));
    return ys;
  };
  switch (id) {
    case "zip":
      return (
        `<path d="M59,${top} L59,${bottom} M61,${top} L61,${bottom}" stroke="${s}" stroke-width="0.8"/>` +
        steps(2, 1).map((y, i) => `<path d="M${i % 2 ? 59 : 61},${y} h${i % 2 ? -1.6 : 1.6}" stroke="${s}" stroke-width="0.8"/>`).join("") +
        `<rect x="58.4" y="${top + 1}" width="3.2" height="5" rx="1" fill="${s}"/>`
      );
    case "buttons":
      return (
        `<path d="M62.5,${top} L62.5,${bottom}" stroke="${s}" stroke-width="0.8"/>` +
        steps(7).map((y) => `<circle cx="60" cy="${y}" r="1.7" fill="${FABRIC}" stroke="${s}" stroke-width="1"/>`).join("")
      );
    case "lace": {
      const ys = steps(6);
      const eyelets = ys.map((y) => `<circle cx="56" cy="${y}" r="0.9" fill="${s}"/><circle cx="64" cy="${y}" r="0.9" fill="${s}"/>`).join("");
      let cross = "";
      for (let i = 0; i < ys.length - 1; i++) cross += `M56,${ys[i]} L64,${ys[i + 1]} M64,${ys[i]} L56,${ys[i + 1]} `;
      const last = ys[ys.length - 1] ?? top;
      return (
        eyelets +
        `<path d="${cross} M58,${last} Q57,${last + 8} 55,${last + 14} M62,${last} Q63,${last + 8} 65,${last + 14}" fill="none" stroke="${s}" stroke-width="0.8" stroke-linecap="round"/>`
      );
    }
    case "hook":
    default:
      return (
        `<path d="M60,${top} L60,${bottom}" stroke="${s}" stroke-width="0.9"/>` +
        steps(5).map((y) => `<path d="M57.5,${y} h5" stroke="${s}" stroke-width="1" stroke-linecap="round"/>`).join("")
      );
  }
}

/* ---------- Composition ---------- */

export function blouseSvg(o: BlouseArtOptions): string {
  const focus = o.focus;
  const sleeve = SLEEVES[o.sleeve ?? "short"] ?? SLEEVES.short;
  const sleeveFocus = focus === "sleeve";
  const sleeveFill = sleeveFocus ? TINT : FABRIC;
  const sleeveStroke = sleeveFocus ? GOLD : INK;

  const sleeveSvg = (attrs = "") =>
    `<g ${attrs}><path d="${sleeve.path}" fill="${sleeveFill}" stroke="${sleeveStroke}" stroke-width="1.6" stroke-linejoin="round"/>` +
    (sleeve.extra ? `<path d="${sleeve.extra}" fill="none" stroke="${sleeveStroke}" stroke-width="0.8" stroke-linecap="round"/>` : "") +
    `</g>`;

  let body: string;
  let details = "";

  if (o.view === "front") {
    const neck = FRONT_NECKS[o.neck ?? "sweetheart"] ?? FRONT_NECKS.sweetheart;
    body = `<path d="${BODY_OUTLINE} ${neck} Z" fill="${FABRIC}" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>`;
    // Front darts give the flat its tailored read.
    details += `<path d="${BODICE_LINES}" fill="none" stroke="${INK}" stroke-opacity="0.35" stroke-width="0.8"/>`;
    details += embroideryArt(o.embroidery);
    if (o.neck === "high")
      details += `<path d="${COLLAR}" fill="${focus === "neck" ? TINT : FABRIC}" stroke="${focus === "neck" ? GOLD : INK}" stroke-width="1.6" stroke-linejoin="round"/>`;
    if (focus === "neck")
      details += `<path d="M74,24 ${neck}" fill="none" stroke="${GOLD}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`;
  } else {
    const style = BACK_STYLES[o.back ?? "plain"] ?? BACK_STYLES.plain;
    const accent = focus === "back" ? GOLD : INK;
    body = `<path d="${BODY_OUTLINE} ${style.neck} Z ${style.holes ?? ""}" fill="${FABRIC}" fill-rule="evenodd" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>`;
    if (focus !== "back" && style.closureTop < 76) details += closureArt(o.stitching, style.closureTop, focus === "stitching" ? GOLD : INK);
    if (focus === "back")
      details += `<path d="M74,24 ${style.neck} ${style.holes ?? ""}" fill="none" stroke="${GOLD}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`;
    if (style.extra) details += style.extra(accent);
  }

  const border = borderArt(o.border, sleeve);

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 4 120 100" role="img">` +
    body +
    sleeveSvg() +
    sleeveSvg(MIRROR) +
    details +
    border +
    `</svg>`
  );
}

/** Thumbnail for one option: the blouse drawn with that choice called out in gold. */
export function optionArtSvg(groupId: string, optionId: string): string {
  switch (groupId) {
    case "neck":
      return blouseSvg({ view: "front", neck: optionId, focus: "neck" });
    case "sleeve":
      return blouseSvg({ view: "front", neck: "jewel", sleeve: optionId, focus: "sleeve" });
    case "back":
      return blouseSvg({ view: "back", back: optionId, focus: "back" });
    case "embroidery":
      return blouseSvg({ view: "front", neck: "sweetheart", embroidery: optionId, focus: "embroidery" });
    case "border":
      return blouseSvg({ view: "front", neck: "boat", sleeve: "elbow", border: optionId, focus: "border" });
    case "stitching":
      return blouseSvg({ view: "back", back: "plain", stitching: optionId, focus: "stitching" });
    default:
      return blouseSvg({ view: "front" });
  }
}

export const optionArtPath = (groupId: string, optionId: string) =>
  `/images/customization/${groupId}/${optionId}.svg`;

/* ---------- Measurement guide ---------- */

/** Where each measurement is taken; keys match MEASUREMENT_FIELDS ids, numbered in that order. */
const GUIDE: { id: string; draw: string; marker: Pt }[] = [
  { id: "bust", draw: "dim:35,59,85,59", marker: [60, 59] },
  { id: "waist", draw: "dim:38.6,75.5,81.4,75.5", marker: [60, 75.5] },
  { id: "shoulder", draw: "dim:30,14,90,14", marker: [60, 14] },
  { id: "armhole", draw: "ring:87,41,4.5,12", marker: [77, 48] },
  { id: "sleeveLength", draw: "dim:25,25,14,40", marker: [11, 30] },
  { id: "blouseLength", draw: "dim:110,30,110,81", marker: [110, 56] },
];

function dimension(x1: number, y1: number, x2: number, y2: number, s: string, w: number): string {
  const len = Math.hypot(x2 - x1, y2 - y1);
  const ux = (x2 - x1) / len;
  const uy = (y2 - y1) / len;
  const head = (x: number, y: number, dx: number, dy: number) => {
    const bx = x - dx * 3;
    const by = y - dy * 3;
    return `M${(bx - dy * 1.6).toFixed(1)},${(by + dx * 1.6).toFixed(1)} L${x},${y} L${(bx + dy * 1.6).toFixed(1)},${(by - dx * 1.6).toFixed(1)}`;
  };
  return (
    `<path d="M${x1},${y1} L${x2},${y2}" stroke="${s}" stroke-width="${w}" stroke-dasharray="2.2 1.6"/>` +
    `<path d="${head(x2, y2, ux, uy)} ${head(x1, y1, -ux, -uy)}" fill="none" stroke="${s}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`
  );
}

/**
 * Front flat with numbered measuring lines. `active` (a measurement id)
 * is drawn strong and the rest recede; with no `active`, all are shown.
 */
export function measurementGuideSvg(active?: string | null): string {
  const sleeve = SLEEVES.short;
  const sleevePath = `<path d="${sleeve.path}" fill="${FABRIC}" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/>`;
  let out =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 4 124 86" role="img">` +
    `<path d="${BODY_OUTLINE} ${FRONT_NECKS.sweetheart} Z" fill="${FABRIC}" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/>` +
    `<path d="${BODICE_LINES}" fill="none" stroke="${INK}" stroke-opacity="0.3" stroke-width="0.7"/>` +
    sleevePath +
    `<g ${MIRROR}>${sleevePath}</g>` +
    `<path d="M30,30 L30,18 M90,30 L90,18 M84,30 L114,30 M62,81 L114,81" stroke="${INK}" stroke-opacity="0.18" stroke-width="0.6"/>`;

  // Draw receding guides first so the active one sits on top.
  const ordered = GUIDE.map((g, i) => ({ ...g, n: i + 1 })).sort(
    (a, b) => Number(a.id === active) - Number(b.id === active)
  );
  for (const g of ordered) {
    const on = !active || g.id === active;
    const s = on ? GOLD : GOLD_SOFT;
    const w = g.id === active ? 1.3 : 0.9;
    const [kind, args] = g.draw.split(":");
    const v = args.split(",").map(Number);
    out += `<g opacity="${on ? 1 : 0.45}">`;
    out +=
      kind === "ring"
        ? `<ellipse cx="${v[0]}" cy="${v[1]}" rx="${v[2]}" ry="${v[3]}" fill="none" stroke="${s}" stroke-width="${w}" stroke-dasharray="2.2 1.6" transform="rotate(-8 ${v[0]} ${v[1]})"/>`
        : dimension(v[0], v[1], v[2], v[3], s, w);
    const [mx, my] = g.marker;
    out +=
      `<circle cx="${mx}" cy="${my}" r="${g.id === active ? 4.6 : 3.8}" fill="${g.id === active ? GOLD_DEEP : s}" stroke="${FABRIC}" stroke-width="1"/>` +
      `<text x="${mx}" y="${my + 1.8}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="${g.id === active ? 5.2 : 4.6}" font-weight="700" fill="#fff">${g.n}</text>`;
    out += `</g>`;
  }
  return out + `</svg>`;
}
