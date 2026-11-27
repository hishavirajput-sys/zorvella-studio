import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const rootDir = process.cwd();
const outputPublicDir = fs.existsSync(path.join(rootDir, ".output/public"))
  ? path.join(rootDir, ".output/public")
  : path.join(rootDir, "dist/client");

if (!fs.existsSync(outputPublicDir)) {
  console.error("Build output directory not found. Run `npm run build` first.");
  process.exit(1);
}

const BUDGETS = {
  maxSingleJsGzipKiB: 250,
  maxTotalJsGzipKiB: 500,
  maxTotalCssGzipKiB: 45,
  maxHeroAvifKiB: 60,
  maxHeroWebpKiB: 90,
  maxHeroFallbackJpgKiB: 90,
  maxFaviconKiB: 20,
  maxSingleFontKiB: 55,
  maxPreloadFontsKiB: 100,
  maxAboveTheFoldWireKiB: 300,
};

function walkFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walkFiles(full) : [full];
  });
}

function sizeKiB(filePath) {
  return fs.statSync(filePath).size / 1024;
}

function gzipKiB(filePath) {
  return zlib.gzipSync(fs.readFileSync(filePath), { level: 9 }).length / 1024;
}

const failures = [];
const allFiles = walkFiles(outputPublicDir);
const assetsDir = path.join(outputPublicDir, "assets");
const assetFiles = walkFiles(assetsDir);

const jsFiles = assetFiles.filter((f) => f.endsWith(".js"));
const cssFiles = assetFiles.filter((f) => f.endsWith(".css"));

let totalJsGzipKiB = 0;
let totalJsRawKiB = 0;
for (const file of jsFiles) {
  const gz = gzipKiB(file);
  totalJsGzipKiB += gz;
  totalJsRawKiB += sizeKiB(file);
  if (gz > BUDGETS.maxSingleJsGzipKiB) {
    failures.push(`JS chunk ${path.basename(file)} (${gz.toFixed(1)} KiB gzip) exceeds ${BUDGETS.maxSingleJsGzipKiB} KiB`);
  }
}
if (totalJsGzipKiB > BUDGETS.maxTotalJsGzipKiB) {
  failures.push(`Total JS (${totalJsGzipKiB.toFixed(1)} KiB gzip) exceeds ${BUDGETS.maxTotalJsGzipKiB} KiB`);
}

let totalCssGzipKiB = 0;
let totalCssRawKiB = 0;
for (const file of cssFiles) {
  totalCssGzipKiB += gzipKiB(file);
  totalCssRawKiB += sizeKiB(file);
}
if (totalCssGzipKiB > BUDGETS.maxTotalCssGzipKiB) {
  failures.push(`Total CSS (${totalCssGzipKiB.toFixed(1)} KiB gzip) exceeds ${BUDGETS.maxTotalCssGzipKiB} KiB`);
}

const heroDir = path.join(outputPublicDir, "site-assets/hero");
const requiredHeroAssets = [
  { name: "hero-640w.avif", limit: BUDGETS.maxHeroAvifKiB },
  { name: "hero-960w.avif", limit: BUDGETS.maxHeroAvifKiB },
  { name: "hero-1376w.avif", limit: BUDGETS.maxHeroAvifKiB },
  { name: "hero-640w.webp", limit: BUDGETS.maxHeroWebpKiB },
  { name: "hero-960w.webp", limit: BUDGETS.maxHeroWebpKiB },
  { name: "hero-1376w.webp", limit: BUDGETS.maxHeroWebpKiB },
  { name: "hero-960w.jpg", limit: BUDGETS.maxHeroFallbackJpgKiB },
];

for (const item of requiredHeroAssets) {
  const full = path.join(heroDir, item.name);
  if (!fs.existsSync(full)) {
    failures.push(`Missing optimized hero asset: ${item.name}`);
  } else {
    const kb = sizeKiB(full);
    if (kb > item.limit) {
      failures.push(`Hero asset ${item.name} (${kb.toFixed(1)} KiB) exceeds ${item.limit} KiB`);
    }
  }
}

const fontsDir = path.join(outputPublicDir, "fonts");
const requiredFonts = [
  "inter-latin.woff2",
  "playfair-display-latin.woff2",
  "playfair-display-latin-italic.woff2",
];
let preloadedFontsKiB = 0;
for (const fontName of requiredFonts) {
  const full = path.join(fontsDir, fontName);
  if (!fs.existsSync(full)) {
    failures.push(`Missing self-hosted WOFF2 font: ${fontName}`);
  } else {
    const kb = sizeKiB(full);
    if (kb > BUDGETS.maxSingleFontKiB) {
      failures.push(`Font ${fontName} (${kb.toFixed(1)} KiB) exceeds ${BUDGETS.maxSingleFontKiB} KiB`);
    }
    if (fontName !== "playfair-display-latin-italic.woff2") {
      preloadedFontsKiB += kb;
    }
  }
}
if (preloadedFontsKiB > BUDGETS.maxPreloadFontsKiB) {
  failures.push(`Preloaded fonts (${preloadedFontsKiB.toFixed(1)} KiB) exceed ${BUDGETS.maxPreloadFontsKiB} KiB`);
}

for (const iconName of ["favicon.ico", "favicon-16x16.png", "favicon-32x32.png", "apple-touch-icon.png"]) {
  const full = path.join(outputPublicDir, iconName);
  if (!fs.existsSync(full)) {
    failures.push(`Missing icon asset: ${iconName}`);
  } else {
    const kb = sizeKiB(full);
    if (kb > BUDGETS.maxFaviconKiB) {
      failures.push(`Icon ${iconName} (${kb.toFixed(1)} KiB) exceeds ${BUDGETS.maxFaviconKiB} KiB`);
    }
  }
}

const heroDesktopAvif = path.join(heroDir, "hero-1376w.avif");
const heroDesktopAvifKiB = fs.existsSync(heroDesktopAvif) ? sizeKiB(heroDesktopAvif) : 999;
const aboveTheFoldWireKiB = totalCssGzipKiB + preloadedFontsKiB + heroDesktopAvifKiB;
if (aboveTheFoldWireKiB > BUDGETS.maxAboveTheFoldWireKiB) {
  failures.push(
    `Above-the-fold wire payload (CSS gzip + preloaded fonts + hero AVIF = ${aboveTheFoldWireKiB.toFixed(1)} KiB) exceeds ${BUDGETS.maxAboveTheFoldWireKiB} KiB`,
  );
}

console.log(
  JSON.stringify(
    {
      outputFiles: allFiles.length,
      totalJsRawKiB: Number(totalJsRawKiB.toFixed(1)),
      totalJsGzipKiB: Number(totalJsGzipKiB.toFixed(1)),
      totalCssRawKiB: Number(totalCssRawKiB.toFixed(1)),
      totalCssGzipKiB: Number(totalCssGzipKiB.toFixed(1)),
      preloadedFontsKiB: Number(preloadedFontsKiB.toFixed(1)),
      heroDesktopAvifKiB: Number(heroDesktopAvifKiB.toFixed(1)),
      aboveTheFoldWireKiB: Number(aboveTheFoldWireKiB.toFixed(1)),
    },
    null,
    2,
  ),
);

if (failures.length > 0) {
  console.error("\nPerformance budget failures:");
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log("\nAll performance budgets passed.");
