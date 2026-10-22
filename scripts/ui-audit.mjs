/**
 * Storefront UI regression audit.
 *
 * Drives an installed Chrome or Edge over the DevTools protocol (no extra
 * dependencies) against a running server, visits every public route at eight
 * viewport widths and fails on page-level horizontal overflow, broken images,
 * unlabeled form fields, console errors, duplicate titles, collapsed editorial
 * cards, squashed purchase buttons and more. Full-page screenshots at 390px and
 * 1366px are written to .ui-audit/.
 *
 * Run with the dev or production server up:
 *   npm run test:ui
 * Options (env): UI_AUDIT_BASE (default http://localhost:3000),
 *                UI_AUDIT_BROWSER (path to chrome/msedge), UI_AUDIT_ROUTES (comma list),
 *                UI_AUDIT_COOKIE ("name=value" session cookie, to audit signed-in pages).
 */
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const BASE = (process.env.UI_AUDIT_BASE ?? "http://localhost:3000").replace(/\/$/, "");
const OUT = join(process.cwd(), ".ui-audit");
const PORT = 9400 + Math.floor(Math.random() * 400);

const ROUTES = process.env.UI_AUDIT_ROUTES?.split(",") ?? [
  "/", "/shop", "/sarees", "/chudithars", "/new-arrivals", "/collections", "/collections/wedding",
  "/product/banarasi-butterfly-silk-saree", "/custom-blouse", "/lookbook", "/about", "/contact",
  "/faqs", "/size-guide", "/shipping", "/returns", "/privacy", "/terms",
  "/cart", "/wishlist", "/login", "/register", "/forgot-password", "/reset-password", "/admin/login",
  "/unsubscribe", "/this-page-does-not-exist",
];
const WIDTHS = [320, 360, 390, 430, 768, 1024, 1280, 1366];
const SHOT_WIDTHS = new Set([390, 1366]);

const EXPECTED_TITLES = {
  "/about": "About UMA Designers",
  "/faqs": "FAQs | UMA Designers",
  "/size-guide": "Size Guide | UMA Designers",
  "/shipping": "Shipping Information | UMA Designers",
  "/returns": "Returns & Exchanges | UMA Designers",
  "/privacy": "Privacy Policy | UMA Designers",
  "/terms": "Terms of Service | UMA Designers",
  "/cart": "Your Bag | UMA Designers",
  "/wishlist": "Wishlist | UMA Designers",
  "/unsubscribe": "Unsubscribe | UMA Designers",
};

function findBrowser() {
  const candidates = [
    process.env.UI_AUDIT_BROWSER,
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ].filter(Boolean);
  const found = candidates.find((p) => existsSync(p));
  if (!found) throw new Error("No Chrome or Edge found. Set UI_AUDIT_BROWSER to its executable path.");
  return found;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function connect() {
  // One reused, size-capped profile inside .ui-audit/ so repeated or interrupted runs never pile up on disk.
  const profile = join(OUT, "profile");
  const browser = spawn(findBrowser(), [
    "--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-first-run", "--no-default-browser-check",
    "--disable-extensions", "--disable-component-update", "--disable-background-networking", "--disable-sync",
    "--disk-cache-size=1", "--media-cache-size=1",
    `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, "about:blank",
  ]);
  let target;
  for (let i = 0; i < 60 && !target; i++) {
    await sleep(500);
    try {
      target = (await (await fetch(`http://127.0.0.1:${PORT}/json`)).json()).find((t) => t.type === "page");
    } catch {}
  }
  if (!target) throw new Error("Browser did not start.");
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener("open", r));
  let id = 0;
  const pending = new Map();
  const events = [];
  ws.addEventListener("message", (e) => {
    const m = JSON.parse(e.data);
    if (m.id) pending.get(m.id)?.(m.result ?? { error: m.error });
    else events.push(m);
  });
  const send = (method, params = {}) =>
    new Promise((r) => {
      pending.set(++id, r);
      ws.send(JSON.stringify({ id, method, params }));
    });
  const close = () => {
    ws.close();
    // On Windows, kill() leaves the browser's helper processes running; end the whole tree.
    if (process.platform === "win32") spawnSync("taskkill", ["/pid", String(browser.pid), "/T", "/F"], { stdio: "ignore" });
    else browser.kill();
    try {
      rmSync(profile, { recursive: true, force: true });
    } catch {}
  };
  process.once("SIGINT", () => {
    close();
    process.exit(130);
  });
  return { send, events, close };
}

/** Runs inside the page. Returns measurements for the current viewport. */
function probe() {
  const vis = (el) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none";
  };
  const label = (el) => `${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""}.${[...el.classList].slice(0, 3).join(".")}`;
  const W = window.innerWidth;
  const headings = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].filter(vis).map((h) => +h.tagName[1]);
  const skips = [];
  for (let i = 1; i < headings.length; i++) if (headings[i] - headings[i - 1] > 1) skips.push(`h${headings[i - 1]}→h${headings[i]}`);
  const wide = [...document.querySelectorAll("body *")]
    .filter((el) => vis(el) && el.getBoundingClientRect().right > W + 1)
    .filter((el) => {
      // Ignore anything clipped by a scrolling/hidden ancestor; that is contained overflow.
      for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
        const o = getComputedStyle(p).overflowX;
        if (o === "auto" || o === "scroll" || o === "hidden" || o === "clip") return false;
      }
      return true;
    })
    .slice(0, 4)
    .map(label);
  const fields = [...document.querySelectorAll("input:not([type=hidden]),select,textarea")].filter(
    (el) => vis(el) || el.classList.contains("sr-only")
  );
  const unlabeled = fields
    .filter((el) => !el.labels?.length && !el.getAttribute("aria-label") && !el.getAttribute("aria-labelledby"))
    .map(label);
  const imgs = [...document.images];
  const cards = [...document.querySelectorAll("[data-editorial-card]")].map((el) => Math.round(el.getBoundingClientRect().height));
  const buyButtons = [...document.querySelectorAll("button")]
    .filter((b) => vis(b) && /^(Add to Bag|Added to Bag|Buy Now)$/.test(b.textContent.trim()))
    .map((b) => Math.round(b.getBoundingClientRect().height));
  const interactive = [...document.querySelectorAll("a[href],button,select,[role=button]")].filter(vis);
  const tiny = interactive
    .filter((el) => {
      const r = el.getBoundingClientRect();
      // Inline text links inside running text or headings are exempt (WCAG 2.5.8).
      return (r.width < 24 || r.height < 24) && !el.classList.contains("sr-only") && !el.closest("p,li,dd,td,label,h1,h2,h3,h4,nav[aria-label=Breadcrumb]");
    })
    .slice(0, 5)
    .map((el) => `${label(el)} "${(el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 24)}"`);
  return {
    title: document.title,
    path: location.pathname,
    h1: [...document.querySelectorAll("h1")].filter(vis).length,
    headingSkips: skips,
    scrollWidth: document.documentElement.scrollWidth,
    width: W,
    wide,
    brokenImages: imgs.filter((i) => i.complete && i.naturalWidth === 0 && i.currentSrc).map((i) => i.currentSrc).slice(0, 4),
    missingAlt: imgs.filter((i) => !i.hasAttribute("alt")).length,
    unlabeled,
    cards,
    buyButtons,
    tiny,
    height: document.documentElement.scrollHeight,
  };
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const { send, events, close } = await connect();
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Log.enable");
  await send("Network.enable");
  if (process.env.UI_AUDIT_COOKIE) {
    const [name, ...value] = process.env.UI_AUDIT_COOKIE.split("=");
    await send("Network.setCookie", { name, value: value.join("="), url: BASE, httpOnly: true });
  }
  const evaluate = async (fn) =>
    (await send("Runtime.evaluate", { expression: `(${fn})()`, returnByValue: true, awaitPromise: true })).result?.value;

  const failures = [];
  const warnings = [];
  const titles = new Map();
  const fail = (route, w, msg) => failures.push(`${route} @${w}px: ${msg}`);

  for (const route of ROUTES) {
    for (const w of WIDTHS) {
      events.length = 0;
      await send("Emulation.setDeviceMetricsOverride", { width: w, height: w < 768 ? 844 : 900, deviceScaleFactor: 1, mobile: w < 768 });
      await send("Page.navigate", { url: BASE + route });
      await sleep(w === WIDTHS[0] ? 4500 : 2500);
      // Walk the page so scroll-triggered reveals settle, then go back to the top.
      await evaluate(async () => {
        const step = Math.round(innerHeight * 0.7);
        for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
          scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 160));
        }
        scrollTo(0, 0);
        await new Promise((r) => setTimeout(r, 900));
      });
      const m = await evaluate(probe);
      if (!m) {
        fail(route, w, "page did not respond");
        continue;
      }

      if (m.scrollWidth > m.width) fail(route, w, `page scrolls sideways by ${m.scrollWidth - m.width}px (${m.wide.join(", ") || "unknown element"})`);
      if (m.brokenImages.length) fail(route, w, `broken images: ${m.brokenImages.join(", ")}`);
      if (m.missingAlt) fail(route, w, `${m.missingAlt} image(s) without alt`);
      if (m.unlabeled.length) fail(route, w, `unlabeled fields: ${m.unlabeled.join(", ")}`);
      if (m.h1 !== 1) fail(route, w, `${m.h1} visible h1 elements`);
      if (m.cards.some((h) => h < 160)) fail(route, w, `editorial card collapsed (heights ${m.cards.join(", ")})`);
      if (m.buyButtons.some((h) => h < 44)) fail(route, w, `purchase button too short (heights ${m.buyButtons.join(", ")})`);
      if (w === 390 || w === 1366) {
        if (m.headingSkips.length) warnings.push(`${route} @${w}px: heading skips ${[...new Set(m.headingSkips)].join(", ")}`);
        if (m.tiny.length) warnings.push(`${route} @${w}px: small targets ${m.tiny.join("; ")}`);
      }

      const errors = events
        .filter(
          (e) =>
            e.method === "Runtime.exceptionThrown" ||
            (e.method === "Runtime.consoleAPICalled" && e.params.type === "error") ||
            (e.method === "Log.entryAdded" && e.params.entry.level === "error")
        )
        .map((e) =>
          (e.params.exceptionDetails?.exception?.description ??
            e.params.args?.map((a) => a.value ?? a.description).join(" ") ??
            e.params.entry?.text ??
            "")
            .split("\n")[0]
            .slice(0, 160)
        )
        .filter((t) => !(route === "/this-page-does-not-exist" && t.includes("404")));
      if (errors.length) fail(route, w, `console errors: ${[...new Set(errors)].join(" | ")}`);

      if (w === 1366) titles.set(route, m.title);
      if (EXPECTED_TITLES[route] && m.title !== EXPECTED_TITLES[route]) fail(route, w, `title "${m.title}", expected "${EXPECTED_TITLES[route]}"`);

      if (SHOT_WIDTHS.has(w)) {
        const scale = w < 768 ? 0.6 : 0.5;
        const shot = await send("Page.captureScreenshot", {
          format: "jpeg",
          quality: 62,
          captureBeyondViewport: true,
          clip: { x: 0, y: 0, width: w, height: Math.min(m.height, 6000), scale },
        });
        const slug = route === "/" ? "home" : route.slice(1).replace(/\//g, "_");
        writeFileSync(join(OUT, `${slug}-${w}.jpg`), Buffer.from(shot.data, "base64"));
      }
    }
    process.stdout.write(`✓ ${route}\n`);
  }

  // Titles must be unique across the audited pages.
  const seen = new Map();
  for (const [route, title] of titles) {
    if (seen.has(title)) failures.push(`${route}: title "${title}" duplicates ${seen.get(title)}`);
    else seen.set(title, route);
  }

  // Empty bag at checkout goes to the bag page.
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await send("Page.navigate", { url: `${BASE}/checkout` });
  await sleep(5000);
  const after = await evaluate(() => location.pathname);
  if (after !== "/cart") failures.push(`/checkout with an empty bag stayed on ${after}, expected redirect to /cart`);

  // Keyboard: the first Tab lands on the skip link.
  await send("Page.navigate", { url: `${BASE}/` });
  await sleep(3500);
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
  const focused = await evaluate(() => document.activeElement?.textContent?.trim());
  if (focused !== "Skip to content") failures.push(`first Tab focused "${focused}", expected the skip link`);

  // Reduced motion: no endless animations keep running.
  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  await send("Page.navigate", { url: `${BASE}/` });
  await sleep(3500);
  const endless = await evaluate(
    () => document.getAnimations().filter((a) => a.playState === "running" && a.effect?.getTiming().iterations === Infinity).length
  );
  if (endless > 0) failures.push(`${endless} endless animation(s) still running with reduced motion`);

  close();

  writeFileSync(join(OUT, "report.json"), JSON.stringify({ base: BASE, routes: ROUTES, widths: WIDTHS, failures, warnings }, null, 2));
  console.log(`\n${ROUTES.length} routes × ${WIDTHS.length} widths checked. Screenshots in .ui-audit/`);
  if (warnings.length) console.log(`\n${warnings.length} warning(s):\n  ${warnings.join("\n  ")}`);
  if (failures.length) {
    console.error(`\n${failures.length} failure(s):\n  ${failures.join("\n  ")}`);
    process.exit(1);
  }
  console.log("\nAll checks passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
