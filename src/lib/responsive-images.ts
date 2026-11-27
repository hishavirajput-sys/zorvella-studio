export interface ResponsiveMediaAsset {
  key: string;
  widths: readonly number[];
  width: number;
  height: number;
  fallbackExt: "jpg" | "webp";
}

const MEDIA_SPECS: Record<string, ResponsiveMediaAsset> = {
  "product-barrier-serum": {
    key: "product-barrier-serum",
    widths: [480, 800, 1200],
    width: 1200,
    height: 896,
    fallbackExt: "jpg",
  },
  "product-radiance-elixir": {
    key: "product-radiance-elixir",
    widths: [480, 800, 1200],
    width: 1200,
    height: 896,
    fallbackExt: "jpg",
  },
  "product-rosehip-cream": {
    key: "product-rosehip-cream",
    widths: [480, 800, 1200],
    width: 1200,
    height: 896,
    fallbackExt: "jpg",
  },
  "product-melt-cleanser": {
    key: "product-melt-cleanser",
    widths: [480, 800, 1200],
    width: 1200,
    height: 896,
    fallbackExt: "jpg",
  },
  "product-eye-balm": {
    key: "product-eye-balm",
    widths: [480, 800, 1200],
    width: 1200,
    height: 896,
    fallbackExt: "jpg",
  },
  "consultation-specialist": {
    key: "consultation-specialist",
    widths: [480, 800, 1200],
    width: 1200,
    height: 896,
    fallbackExt: "jpg",
  },
  "editorial-about-atelier": {
    key: "editorial-about-atelier",
    widths: [480, 800, 1376],
    width: 1376,
    height: 768,
    fallbackExt: "jpg",
  },
  "editorial-ingredients-macro": {
    key: "editorial-ingredients-macro",
    widths: [480, 800, 1376],
    width: 1376,
    height: 768,
    fallbackExt: "jpg",
  },
  "editorial-our-science": {
    key: "editorial-our-science",
    widths: [480, 800, 1376],
    width: 1376,
    height: 768,
    fallbackExt: "jpg",
  },
  "step-cleanse": {
    key: "step-cleanse",
    widths: [480, 800, 960],
    width: 960,
    height: 640,
    fallbackExt: "webp",
  },
  "step-treat": {
    key: "step-treat",
    widths: [480, 800, 960],
    width: 960,
    height: 640,
    fallbackExt: "webp",
  },
  "step-hydrate": {
    key: "step-hydrate",
    widths: [480, 800, 960],
    width: 960,
    height: 640,
    fallbackExt: "webp",
  },
  "step-protect": {
    key: "step-protect",
    widths: [480, 800, 960],
    width: 960,
    height: 640,
    fallbackExt: "webp",
  },
  "science-editorial": {
    key: "science-editorial",
    widths: [480, 800, 1200],
    width: 1440,
    height: 1152,
    fallbackExt: "webp",
  },
  "zorvellae-hero": {
    key: "zorvellae-hero",
    widths: [480, 800, 1200],
    width: 1440,
    height: 1080,
    fallbackExt: "webp",
  },
  "zorvellae-science": {
    key: "zorvellae-science",
    widths: [480, 800, 1200],
    width: 1440,
    height: 1152,
    fallbackExt: "webp",
  },
};

const PATH_TO_KEY: Record<string, string> = {
  "/site-assets/generated/product_barrier_serum_1795670125183.jpg": "product-barrier-serum",
  "/site-assets/generated/product_radiance_elixir_1795670125654.jpg": "product-radiance-elixir",
  "/site-assets/generated/product_rosehip_cream_1795670125752.jpg": "product-rosehip-cream",
  "/site-assets/generated/product_melt_cleanser_1795670127118.jpg": "product-melt-cleanser",
  "/site-assets/generated/product_eye_balm_1795670126729.jpg": "product-eye-balm",
  "/site-assets/generated/consultation_skincare_specialist_1795752504253.jpg": "consultation-specialist",
  "/site-assets/generated/editorial_about_atelier_1795670128506.jpg": "editorial-about-atelier",
  "/site-assets/generated/editorial_ingredients_macro_1795670127823.jpg": "editorial-ingredients-macro",
  "/site-assets/generated/editorial_our_science_1795670127021.jpg": "editorial-our-science",
  "/site-assets/home/step-cleanse.webp": "step-cleanse",
  "/site-assets/home/step-treat.webp": "step-treat",
  "/site-assets/home/step-hydrate.webp": "step-hydrate",
  "/site-assets/home/step-protect.webp": "step-protect",
  "/site-assets/home/science-editorial.webp": "science-editorial",
  "/site-assets/zorvellae-hero.webp": "zorvellae-hero",
  "/site-assets/zorvellae-science.webp": "zorvellae-science",
};

export const STOREFRONT_MEDIA_KEYS = Object.keys(MEDIA_SPECS);

export function resolveResponsiveMedia(src: string): ResponsiveMediaAsset | null {
  const cleaned = src.split("?")[0]?.trim() ?? "";
  const mappedKey = PATH_TO_KEY[cleaned];
  if (mappedKey && MEDIA_SPECS[mappedKey]) {
    return MEDIA_SPECS[mappedKey] ?? null;
  }
  const mediaMatch = /^\/site-assets\/media\/([^/]+)\//.exec(cleaned);
  if (mediaMatch && mediaMatch[1] && MEDIA_SPECS[mediaMatch[1]]) {
    return MEDIA_SPECS[mediaMatch[1]] ?? null;
  }
  return null;
}

export function buildMediaSrcSet(spec: ResponsiveMediaAsset, format: "avif" | "webp"): string {
  return spec.widths.map((w) => `/site-assets/media/${spec.key}/${w}w.${format} ${w}w`).join(", ");
}

export function getMediaFallbackSrc(spec: ResponsiveMediaAsset): string {
  return `/site-assets/media/${spec.key}/800w.${spec.fallbackExt}`;
}
