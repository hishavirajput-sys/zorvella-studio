import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import zlib from "node:zlib";

const rootDir = process.cwd();
const outputPublicDir = fs.existsSync(path.join(rootDir, ".output/public"))
  ? path.join(rootDir, ".output/public")
  : path.join(rootDir, "dist/client");
const outputServerDir = path.join(rootDir, ".output/server");

if (!fs.existsSync(outputPublicDir)) {
  console.error("Build output directory not found. Run `npm run build` first.");
  process.exit(1);
}

const BUDGETS = {
  maxInitialRouteJsGzipKiB: 170,
  maxSingleJsGzipKiB: 250,
  maxTotalJsGzipKiB: 500,
  maxTotalCssGzipKiB: 45,
  maxHeroAvifKiB: 60,
  maxHeroWebpKiB: 90,
  maxHeroFallbackJpgKiB: 90,
  maxAnyStorefrontImageKiB: 140,
  maxResponsiveAvif480KiB: 30,
  maxResponsiveAvif800KiB: 50,
  maxFaviconKiB: 20,
  maxSingleFontKiB: 35,
  maxPreloadFontsKiB: 60,
  maxAboveTheFoldWireKiB: 300,
};

const STOREFRONT_MEDIA_KEYS = [
  "product-barrier-serum",
  "product-radiance-elixir",
  "product-rosehip-cream",
  "product-melt-cleanser",
  "product-eye-balm",
  "consultation-specialist",
  "editorial-about-atelier",
  "editorial-ingredients-macro",
  "editorial-our-science",
  "step-cleanse",
  "step-treat",
  "step-hydrate",
  "step-protect",
  "science-editorial",
  "zorvellae-hero",
  "zorvellae-science",
];

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

let initialRouteJsGzipKiB = 0;
let initialRouteFiles = [];
const manifestFile = fs.existsSync(outputServerDir)
  ? fs.readdirSync(outputServerDir).find((name) => name.startsWith("_tanstack-start-manifest_v-") && name.endsWith(".mjs"))
  : undefined;

if (!manifestFile) {
  failures.push("Missing TanStack Start client asset manifest in .output/server for initial-route JS verification.");
} else {
  const mod = await import(pathToFileURL(path.join(outputServerDir, manifestFile)).href);
  const manifest = typeof mod.tsrStartManifest === "function" ? mod.tsrStartManifest() : null;
  const rootRoute = manifest?.routes?.__root__;
  const homeRoute = manifest?.routes?.["/"];
  if (!rootRoute || !homeRoute) {
    failures.push("Client manifest is missing __root__ or / route entries.");
  } else {
    const urls = new Set([
      ...(rootRoute.scripts ?? []).map((entry) => entry?.attrs?.src).filter(Boolean),
      ...(rootRoute.preloads ?? []),
      ...(homeRoute.preloads ?? []),
    ]);
    initialRouteFiles = [...urls];
    for (const urlPath of urls) {
      const cleanRel = String(urlPath).replace(/^\/+/, "");
      const fullPath = path.join(outputPublicDir, cleanRel);
      if (!fs.existsSync(fullPath)) {
        failures.push(`Missing initial-route JS asset: ${urlPath}`);
      } else {
        initialRouteJsGzipKiB += gzipKiB(fullPath);
      }
    }
    if (initialRouteJsGzipKiB > BUDGETS.maxInitialRouteJsGzipKiB) {
      failures.push(
        `Initial-route / JS (${initialRouteJsGzipKiB.toFixed(1)} KiB gzip across ${urls.size} chunks) exceeds ${BUDGETS.maxInitialRouteJsGzipKiB} KiB`,
      );
    }
  }
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

const mediaDir = path.join(outputPublicDir, "site-assets/media");
for (const key of STOREFRONT_MEDIA_KEYS) {
  const itemDir = path.join(mediaDir, key);
  for (const variant of ["480w.avif", "800w.avif", "480w.webp", "800w.webp"]) {
    const full = path.join(itemDir, variant);
    if (!fs.existsSync(full)) {
      failures.push(`Missing responsive storefront media variant: ${key}/${variant}`);
    } else if (variant === "480w.avif" && sizeKiB(full) > BUDGETS.maxResponsiveAvif480KiB) {
      failures.push(`Media ${key}/480w.avif (${sizeKiB(full).toFixed(1)} KiB) exceeds ${BUDGETS.maxResponsiveAvif480KiB} KiB`);
    } else if (variant === "800w.avif" && sizeKiB(full) > BUDGETS.maxResponsiveAvif800KiB) {
      failures.push(`Media ${key}/800w.avif (${sizeKiB(full).toFixed(1)} KiB) exceeds ${BUDGETS.maxResponsiveAvif800KiB} KiB`);
    }
  }
}

const siteAssetFiles = walkFiles(path.join(outputPublicDir, "site-assets"));
let largestSiteImage = { file: "", sizeKiB: 0 };
for (const file of siteAssetFiles) {
  if (!/\.(avif|webp|jpe?g|png)$/i.test(file)) continue;
  const kb = sizeKiB(file);
  if (kb > largestSiteImage.sizeKiB) {
    largestSiteImage = { file: path.relative(outputPublicDir, file), sizeKiB: Number(kb.toFixed(1)) };
  }
  if (kb > BUDGETS.maxAnyStorefrontImageKiB) {
    failures.push(
      `Oversized storefront asset ${path.relative(outputPublicDir, file)} (${kb.toFixed(1)} KiB) exceeds ${BUDGETS.maxAnyStorefrontImageKiB} KiB`,
    );
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
      initialRouteChunkCount: initialRouteFiles.length,
      initialRouteJsGzipKiB: Number(initialRouteJsGzipKiB.toFixed(1)),
      totalJsRawKiB: Number(totalJsRawKiB.toFixed(1)),
      totalJsGzipKiB: Number(totalJsGzipKiB.toFixed(1)),
      totalCssRawKiB: Number(totalCssRawKiB.toFixed(1)),
      totalCssGzipKiB: Number(totalCssGzipKiB.toFixed(1)),
      preloadedFontsKiB: Number(preloadedFontsKiB.toFixed(1)),
      heroDesktopAvifKiB: Number(heroDesktopAvifKiB.toFixed(1)),
      largestSiteImage,
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
