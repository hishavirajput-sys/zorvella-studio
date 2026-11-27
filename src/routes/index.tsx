import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  ArrowUp,
  ChevronRight,
  Droplet,
  FlaskConical,
  Heart,
  Leaf,
  ShieldCheck,
  Sparkles,
  Star,
  X,
} from "lucide-react";

import { ResponsiveStoreImage } from "@/components/responsive-image";
import {
  ProductGrid,
  Storefront,
  formatPrice,
  productStartingPrice,
  useStoreCart,
} from "@/components/storefront";
import { Button } from "@/components/ui/button";
import { notify } from "@/lib/notify";
import { catalogQueryOptions } from "@/lib/store-data";

const values = [
  {
    title: "Science-led bio-actives",
    detail: "Potent multi-molecular peptides with biomimetic cellular absorption.",
    icon: FlaskConical,
  },
  {
    title: "Clean formulations",
    detail: "Zero synthetic fragrances, parabens, endocrine disruptors, or sulfates.",
    icon: Droplet,
  },
  {
    title: "Dermatologically proven",
    detail: "Non-comedogenic and rigorously tested on reactive, sensitized skin types.",
    icon: ShieldCheck,
  },
  {
    title: "Cruelty-free & vegan",
    detail: "Leaping Bunny certified, ethical wild-harvested plant botanicals.",
    icon: Heart,
  },
];

const steps = [
  {
    number: "01",
    title: "Essential Cleansers",
    copy: "Barrier-sparing amino acid cleansing balms & micellar broths.",
    cta: "Explore cleansers",
    slug: "cleansers",
    image: "/site-assets/home/step-cleanse.webp",
    imageAlt: "Cleansing ritual application beside botanical balm textures.",
  },
  {
    number: "02",
    title: "Treatment Serums",
    copy: "Concentrated bio-peptides, clinical ferments, and stable vitamin matrices.",
    cta: "Explore serums",
    slug: "serums",
    image: "/site-assets/home/step-treat.webp",
    imageAlt: "ZORVELLAE amber treatment serum bottle surrounded by botanical foliage.",
  },
  {
    number: "03",
    title: "Barrier Creams",
    copy: "Squalane and lipid emulsions that lock hydration for 48 uninterrupted hours.",
    cta: "Explore creams",
    slug: "barrier-creams",
    image: "/site-assets/home/step-hydrate.webp",
    imageAlt: "Restorative barrier cream jar on warm stone tray.",
  },
  {
    number: "04",
    title: "Restorative Eye Elixirs",
    copy: "Caffeine-infused micro-peptides targeting orbital lymph drainage and dark circles.",
    cta: "Explore eye care",
    slug: "eye-care",
    image: "/site-assets/home/step-protect.webp",
    imageAlt: "ZORVELLAE Revitalizing Eye Balm jar beside botanical blooms.",
  },
];

const researchMetrics = [
  {
    label: "Barrier lipid restoration",
    value: "96%",
    percent: 96,
    note: "Subjects experienced measured reduction in trans-epidermal water loss (TEWL) over 14 days.",
  },
  {
    label: "Micro-relief smoothing",
    value: "94%",
    percent: 94,
    note: "Instrumental 3D surface scanning confirmed measurable improvement in stratum smoothness.",
  },
  {
    label: "Zero sensitive reaction",
    value: "100%",
    percent: 100,
    note: "Certified non-comedogenic and hypoallergenic across 60 cohort evaluations.",
  },
];

const curatedRituals = [
  {
    id: "evening-restoration",
    eyebrow: "Evening ritual",
    title: "The 3-Step Barrier Restoration Ritual",
    saving: "Save $26",
    price: 158,
    compareAt: 184,
    steps: [
      "Step 1: Peptide Melt Cleanser (150ml)",
      "Step 2: Ceramide Barrier Serum (30ml)",
      "Step 3: Restorative Rosehip Cream (50ml)",
    ],
    summary:
      "Calibrated for compromised skin barriers, post-sun sensitivity, and extreme lipid depletion.",
    image: "/site-assets/generated/product_rosehip_cream_1795670125752.jpg",
    imageAlt: "Evening barrier restoration cream jar and botanical ritual textures.",
    productSlugs: [
      "peptide-gentle-melt-cleanser",
      "ceramide-bio-peptide-barrier-serum",
      "squalane-fermented-rosehip-cream",
    ],
  },
  {
    id: "morning-radiance",
    eyebrow: "Morning ritual",
    title: "The Cellular Radiance Morning Routine",
    saving: "Save $26",
    price: 142,
    compareAt: 168,
    steps: [
      "Step 1: Peptide Melt Cleanser (150ml)",
      "Step 2: Phyto-Niacinamide Elixir (30ml)",
      "Step 3: Restorative Eye Balm (15ml)",
    ],
    summary:
      "Antioxidant morning shield engineered to brighten hyperpigmentation and restore skin elasticity.",
    image: "/site-assets/generated/product_radiance_elixir_1795670125654.jpg",
    imageAlt: "Morning cellular radiance routine frosted glass bottle beside alpine botanicals.",
    productSlugs: [
      "peptide-gentle-melt-cleanser",
      "phyto-niacinamide-radiance-elixir",
      "restorative-peptide-eye-balm",
    ],
  },
];

const dispatches = [
  {
    id: "stratum-corneum",
    kicker: "Cellular biology",
    title: "Understanding the Stratum Corneum: Why Ceramides Dictate Barrier Health",
    excerpt:
      "How physiological 3:1:1 lipid ratios govern cellular cohesion, prevent chronic micro-inflammation, and lock moisture in harsh climates.",
    readTime: "6 min read",
    image: "/site-assets/generated/editorial_ingredients_macro_1795670127823.jpg",
    imageAlt: "Macro study of rosehip lipids, centella leaves, and colloidal oat extracts.",
    article: [
      "The outermost layer of human skin, the stratum corneum, relies on a disciplined architecture often described as brick and mortar: corneocytes bound together by an intercellular lipid matrix rich in ceramides, cholesterol, and free fatty acids.",
      "When harsh surfactants, cold dry air, or over-exfoliation strip that lipid mortar, trans-epidermal water loss accelerates and reactive signaling cascades follow. Formulating with bio-identical Ceramide NP in physiological molar balance helps replenish barrier cohesion without occlusive heaviness.",
    ],
  },
  {
    id: "botanical-ferments",
    kicker: "Formulation science",
    title: "Botanical Ferments vs. Synthetic Actives: The Bioavailability Advantage",
    excerpt:
      "Why breaking down plant actives via micro-fermentation multiplies dermal penetration while eliminating traditional irritation triggers.",
    readTime: "4 min read",
    image: "/site-assets/generated/editorial_our_science_1795670127021.jpg",
    imageAlt: "Formulation specialist calibrating botanical ferments inside ZORVELLAE studio.",
    article: [
      "Whole botanical extracts often contain large molecular weight compounds that remain on the skin surface. Controlled bio-fermentation enzymatically refines polyphenol and fatty-acid chains into smaller, skin-compatible fractions.",
      "Pairing fermented plant lipids with precision bio-peptides delivers calm comfort for reactive barriers while maintaining formulation stability without synthetic solubilizers or essential-oil sensitizers.",
    ],
  },
  {
    id: "circadian-skincare",
    kicker: "Ritual architecture",
    title: "Circadian Skincare: Timing Your Morning Defense vs Evening Cellular Repair",
    excerpt:
      "Aligning your topical application with your skin's biological clock for enhanced nocturnal mitochondrial synthesis and daytime protection.",
    readTime: "5 min read",
    image: "/site-assets/generated/editorial_about_atelier_1795670128506.jpg",
    imageAlt: "Warm sunlit architectural atelier shelving amber skincare bottles.",
    article: [
      "Skin physiology shifts measurably over a 24-hour cycle: daytime prioritizes oxidative defense and sebum equilibrium, whereas nighttime permeability rises alongside cellular turnover and lipid replenishment.",
      "Structuring mornings around buffered Phyto-Niacinamide and antioxidant moisture, then transitioning evenings to Bio-Ceramide and fermented squalane lipids honors both phases effortlessly.",
    ],
  },
];

const faqs = [
  {
    question: "What defines a Zorvellae 'science-led botanical' formulation?",
    answer:
      "Our formulations combine clean, cold-processed botanical extracts with bio-identical clinical actives (such as encapsulated bio-peptides, multi-molecular hyaluronic acid, and human-identical ceramides). This creates high bioavailability without subjecting sensitive skin to the volatility of raw unrefined plant compounds.",
    defaultOpen: true,
  },
  {
    question: "Are these formulations safe for rosacea, eczema, and sensitized barriers?",
    answer:
      "Every ZORVELLAE formula is crafted without synthetic fragrance, drying alcohols, sulfates, or essential-oil sensitizers. We buffer actives near skin's native pH (5.2–5.8) and patch-test across reactive cohorts, though we always recommend consulting a dermatologist for diagnosed clinical conditions.",
  },
  {
    question: "How soon can visible textural improvements be expected?",
    answer:
      "Immediate hydration comfort is typically noticeable within the first 24–48 hours. Measurable barrier lipid reinforcement and calmer surface tone develop progressively across 14 to 28 days of consistent morning and evening application.",
  },
  {
    question: "What are your sustainable packaging and refill initiatives?",
    answer:
      "Our glass dropper vessels and barrier cream jars are housed in UV-shielded recyclable glass paired with FSC-certified paperboard cartons printed in soy-based inks, designed to transition seamlessly into low-waste refill cartridges.",
  },
];

const testimonials = [
  {
    quote:
      "\"My sensitized barrier healed in under 10 days. The Bio-Peptide Serum is truly medical grade elegance.\"",
    detail:
      "The texture absorbs without any residual stickiness. My chronic morning redness simply vanished.",
    initials: "DR",
    author: "Dr. Rachel Chen, MD",
    role: "Board-Certified Dermatologist · Verified Client",
  },
  {
    quote:
      "\"Finally, a clean formula that respects skin science rather than capitalizing on buzzwords.\"",
    detail:
      "The Rosehip Restorative Cream cushions dry winter skin completely overnight. An absolute masterpiece of formulation.",
    initials: "EM",
    author: "Elena Mercier",
    role: "Cosmetic Formulation Chemist · Verified Client",
  },
  {
    quote:
      "\"The 3-Step Barrier Restoration transformed my dull complexion. Glass skin with zero irritation.\"",
    detail:
      "I have hyper-reactive skin that rejects almost everything. Zorvellae has restored my confidence in skincare.",
    initials: "SK",
    author: "Sophia K.",
    role: "Verified Collector · 12 Rituals Completed",
  },
];

const diagnosticQuestions = [
  {
    id: "priority",
    prompt: "What is your primary skin barrier goal right now?",
    options: [
      { id: "barrier", label: "Calm redness & rebuild a sensitized barrier" },
      { id: "radiance", label: "Brighten uneven tone & restore glow" },
      { id: "hydration", label: "Relieve persistent dryness & tightness" },
    ],
  },
  {
    id: "sensitivity",
    prompt: "How does your skin respond when introducing active serums?",
    options: [
      { id: "reactive", label: "Easily flushed or stings with strong acids" },
      { id: "balanced", label: "Moderately tolerant with proper buffering" },
      { id: "resilient", label: "Resilient, seeking targeted smoothness" },
    ],
  },
  {
    id: "climate",
    prompt: "Which climate environment describes your daily routine?",
    options: [
      { id: "dry", label: "Dry, cold, or indoor climate-controlled" },
      { id: "humid", label: "Warm, coastal, or humid conditions" },
      { id: "urban", label: "Urban environment with daily UV & pollution" },
    ],
  },
  {
    id: "texture",
    prompt: "Which finish feels most comfortable at the end of your ritual?",
    options: [
      { id: "velvet", label: "Velvety, weightless serum-lotion feel" },
      { id: "rich", label: "Cushioned, lipid-rich overnight seal" },
      { id: "dewy", label: "Fresh, luminous daytime moisture" },
    ],
  },
  {
    id: "eye-focus",
    prompt: "Do you experience morning puffiness or fine lines around the eye contour?",
    options: [
      { id: "yes", label: "Yes, include targeted orbital care" },
      { id: "minimal", label: "Occasionally after travel or late nights" },
    ],
  },
  {
    id: "cadence",
    prompt: "How many steps fit sustainably into your daily ritual?",
    options: [
      { id: "three", label: "3 essentials: Cleanse, Treat, Seal" },
      { id: "four", label: "4 targeted steps including Eye Care" },
    ],
  },
] as const;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ZORVELLAE — Botanical Skincare, Considered" },
      {
        name: "description",
        content:
          "Discover ZORVELLAE: science-led botanical formulations crafted with bio-peptides, fermented flora, and skin-identical ceramides.",
      },
      { property: "og:title", content: "ZORVELLAE — Botanical Skincare, Considered" },
      {
        property: "og:description",
        content:
          "Botanical intelligence. Clinical intention. Thoughtfully formulated skincare for resilient, balanced skin.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "preload",
        as: "image",
        type: "image/avif",
        imageSrcSet:
          "/site-assets/hero/hero-640w.avif 640w, /site-assets/hero/hero-960w.avif 960w, /site-assets/hero/hero-1376w.avif 1376w",
        imageSizes: "100vw",
        fetchPriority: "high",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogQueryOptions()),
  component: HomePage,
});

function HomePage() {
  const { data: products } = useSuspenseQuery(catalogQueryOptions());
  const { addItem } = useStoreCart();
  const [diagnosticOpen, setDiagnosticOpen] = useState(false);
  const [diagnosticStep, setDiagnosticStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [activeDispatch, setActiveDispatch] = useState<(typeof dispatches)[number] | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const updateScrollVisibility = () => {
      setShowBackToTop(window.scrollY > 420);
    };
    updateScrollVisibility();
    window.addEventListener("scroll", updateScrollVisibility, { passive: true });
    return () => window.removeEventListener("scroll", updateScrollVisibility);
  }, []);

  function scrollToTop() {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }

  async function addRitualBundle(slugs: string[], ritualTitle: string) {
    const matched = slugs
      .map((slug) => products.find((product) => product.slug === slug))
      .filter((product): product is NonNullable<typeof product> => Boolean(product));

    if (matched.length === 0) {
      notify.info("Browse individual steps in the catalog.");
      return;
    }

    for (const product of matched) {
      await addItem(product);
    }
    notify.success(`${ritualTitle} steps added to your bag.`);
  }

  const currentQuestion = diagnosticQuestions[diagnosticStep];
  const diagnosticDone = diagnosticStep >= diagnosticQuestions.length;

  const recommendedProducts = (() => {
    const goal = answers["priority"] ?? "barrier";
    const includeEye = answers["eye-focus"] === "yes" || answers["cadence"] === "four";
    const slugs = [
      "peptide-gentle-melt-cleanser",
      goal === "radiance"
        ? "phyto-niacinamide-radiance-elixir"
        : "ceramide-bio-peptide-barrier-serum",
      "squalane-fermented-rosehip-cream",
      ...(includeEye ? ["restorative-peptide-eye-balm"] : []),
    ];
    return slugs
      .map((slug) => products.find((entry) => entry.slug === slug))
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
  })();

  function selectDiagnosticOption(questionId: string, optionId: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
    setDiagnosticStep((step) => step + 1);
  }

  function resetDiagnostic() {
    setAnswers({});
    setDiagnosticStep(0);
  }

  return (
    <Storefront>
      <section className="home-hero-canvas">
        <div className="home-hero-media">
          <picture>
            <source
              type="image/avif"
              srcSet="/site-assets/hero/hero-640w.avif 640w, /site-assets/hero/hero-960w.avif 960w, /site-assets/hero/hero-1376w.avif 1376w"
              sizes="100vw"
            />
            <source
              type="image/webp"
              srcSet="/site-assets/hero/hero-640w.webp 640w, /site-assets/hero/hero-960w.webp 960w, /site-assets/hero/hero-1376w.webp 1376w"
              sizes="100vw"
            />
            <img
              src="/site-assets/hero/hero-960w.jpg"
              srcSet="/site-assets/hero/hero-960w.jpg 960w"
              sizes="100vw"
              width={1376}
              height={768}
              alt="ZORVELLAE Active Botanical Oil Night Repair and Ultra-Restorative Serum bottles on travertine stone"
              loading="eager"
              decoding="async"
              fetchPriority="high"
              referrerPolicy="no-referrer"
            />
          </picture>
          <div className="home-hero-scrim" aria-hidden="true" />
        </div>

        <div className="home-hero-inner">
          <div className="home-hero-copy">
            <span className="hero-kicker-tag">
              Clinical formulation · Dermatological in-vivo efficacy
            </span>
            <h1 className="home-title">
              Where Botanical Purity Meets <em>Clinical Efficacy.</em>
            </h1>
            <p className="home-summary">
              Formulated with biocompatible bio-peptides, fermented botanical flora, and
              barrier-repairing lipid ceramides for cellular resilience and luminous skin vitality.
            </p>
            <div className="home-cta-row">
              <Link className="store-link" to="/shop">
                Shop the formulations
              </Link>
              <Link className="store-link store-link-outline" to="/our-science">
                Discover our science <ArrowRight size={13} aria-hidden="true" />
              </Link>
            </div>
            <div className="hero-compound-card">
              <span className="hero-compound-icon" aria-hidden="true">
                <Leaf size={16} />
              </span>
              <div className="hero-compound-copy">
                <span className="eyebrow">Active compound · Triple barrier reinforcement</span>
                <strong>Bio-Ceramide III + 5% Niacinamide</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="home-hero-trustbar">
          <div className="home-hero-trustbar-inner">
            <span>Dermatologist tested</span>
            <span aria-hidden="true">·</span>
            <span>Cruelty-free &amp; vegan</span>
            <span aria-hidden="true">·</span>
            <span>Clinically validated (+142% hydration boost)</span>
            <span aria-hidden="true">·</span>
            <span>98.4% cellular retention</span>
          </div>
        </div>
      </section>

      <section className="value-strips" aria-label="Our formulation principles">
        {values.map(({ title, detail, icon: Icon }) => (
          <div className="value-strip" key={title}>
            <span className="value-icon">
              <Icon aria-hidden="true" />
            </span>
            <p>
              <strong>{title}</strong>
              {detail}
            </p>
          </div>
        ))}
      </section>

      <section className="step-section home-step-section">
        <div className="section-heading section-heading-split">
          <div>
            <span className="section-kicker">The step architecture</span>
            <h2>Shop by Formulation Step</h2>
          </div>
          <p className="section-heading-aside">
            Every phase engineered to respect skin lipid bilayers, maximizing molecular absorption
            and long-term barrier protection.
          </p>
        </div>
        <div className="step-grid">
          {steps.map((step) => (
            <Link
              className="step-card"
              key={step.number}
              to="/shop/category/$slug"
              params={{ slug: step.slug }}
            >
              <span className="step-image">
                <ResponsiveStoreImage
                  src={step.image}
                  alt={step.imageAlt}
                  sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 24vw"
                />
                <span className="step-index">Step {step.number}</span>
              </span>
              <span className="step-copy">
                <strong>{step.title}</strong>
                <span>{step.copy}</span>
                <span className="step-link">
                  {step.cta} <ChevronRight size={11} aria-hidden="true" />
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="featured-section home-formulations-section">
        <div className="section-heading">
          <div>
            <span className="section-kicker">Empirical efficacy</span>
            <h2>Our Proven Formulations</h2>
          </div>
          <Link to="/shop" className="text-link">
            View complete catalog <ArrowRight size={13} aria-hidden="true" />
          </Link>
        </div>
        <div className="home-product-grid">
          <ProductGrid products={products.slice(0, 4)} onQuickAdd />
        </div>
      </section>

      <section className="editorial-section home-science-section">
        <div className="home-science-layout">
          <div className="home-research-collage" aria-label="Illustrative botanical research imagery">
            <figure className="collage-card collage-media">
              <ResponsiveStoreImage
                src="/site-assets/generated/editorial_ingredients_macro_1795670127823.jpg"
                alt="Fresh centella leaves, rosehip lipid drops, and oat grains studied for hydration"
                sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 280px"
              />
            </figure>
            <figure className="collage-card collage-media">
              <ResponsiveStoreImage
                src="/site-assets/generated/product_barrier_serum_1795670125183.jpg"
                alt="Frosted amber bio-peptide barrier serum bottle on warm travertine stone"
                sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 280px"
              />
            </figure>
            <figure className="collage-card collage-media">
              <ResponsiveStoreImage
                src="/site-assets/generated/editorial_our_science_1795670127021.jpg"
                alt="Dermatological formulation researcher evaluating clean botanical batches"
                sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 280px"
              />
            </figure>
            <div className="collage-card collage-spec-card">
              <span className="eyebrow">Standard 06-B</span>
              <strong>Pure In-Vitro Biomimicry</strong>
              <p>100% bio-compatible cellular receptors.</p>
            </div>
          </div>

          <div className="home-science-copy">
            <span className="section-kicker">Empirical dermatological research</span>
            <h2>
              Formulated with Reverence for <em>Skin Biology.</em>
            </h2>
            <p>
              Conventional skincare treats the surface; Zorvellae engages the lipid micro-matrix.
              Developed in partnership with dermatologists, our proprietary peptide fermentation
              bio-engine mirrors the lipid composition of healthy, youthful epidermis.
            </p>
            <div className="home-metrics-list">
              {researchMetrics.map((metric) => (
                <div className="home-metric-row" key={metric.label}>
                  <div className="home-metric-head">
                    <span className="home-metric-label">{metric.label}</span>
                    <strong className="home-metric-value">{metric.value}</strong>
                  </div>
                  <div className="home-metric-bar" aria-hidden="true">
                    <span style={{ width: `${metric.percent}%` }} />
                  </div>
                  <p className="home-metric-note">{metric.note}</p>
                </div>
              ))}
            </div>
            <Link to="/our-science" className="text-link">
              Explore our monograph releases &amp; clinical trials{" "}
              <ArrowRight size={13} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section className="home-ritual-section">
        <div className="home-centered-heading">
          <span className="section-kicker">Synergistic sets</span>
          <h2>Curated Clinical Rituals</h2>
          <p>
            Formulations calibrated to compound in synergy. Bundled rituals feature an intentional
            15% saving.
          </p>
        </div>
        <div className="home-ritual-feature-grid">
          {curatedRituals.map((ritual) => (
            <article className="home-ritual-feature" key={ritual.id}>
              <div className="home-ritual-image">
                <ResponsiveStoreImage
                  src={ritual.image}
                  alt={ritual.imageAlt}
                  sizes="(max-width: 768px) 92vw, 44vw"
                />
                <span className="ritual-saving-tag">{ritual.saving}</span>
              </div>
              <div className="home-ritual-copy">
                <span className="section-kicker">{ritual.eyebrow}</span>
                <h3>{ritual.title}</h3>
                <ul className="ritual-steps-list">
                  {ritual.steps.map((stepLine) => (
                    <li key={stepLine}>{stepLine}</li>
                  ))}
                </ul>
                <p>{ritual.summary}</p>
                <div className="ritual-footer-row">
                  <div className="ritual-price-stack">
                    <strong>{formatPrice(ritual.price)}</strong>
                    <span>{formatPrice(ritual.compareAt)}</span>
                  </div>
                  <Button
                    type="button"
                    className="store-link ritual-action-button"
                    onClick={() => void addRitualBundle(ritual.productSlugs, ritual.title)}
                  >
                    Shop the ritual
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="home-diagnostic-section">
        <div className="home-diagnostic-banner">
          <div className="home-diagnostic-copy">
            <span className="section-kicker">
              <Sparkles size={11} aria-hidden="true" /> 2-minute diagnostic
            </span>
            <h2>Uncover Your Skin&apos;s Precision Prescription.</h2>
            <p>
              Answer 6 targeted diagnostic questions crafted by our formulation team. Receive a
              bespoke bio-compatible regimen tailored to your lipid barrier, climate, and cellular
              vitality goals.
            </p>
            <div className="home-diagnostic-actions">
              <Button
                type="button"
                className="store-link"
                onClick={() => setDiagnosticOpen(true)}
              >
                Start skin diagnostic
              </Button>
              <span className="diagnostic-proof-note">
                Personalized multi-step barrier protocol
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="home-dispatch-section">
        <div className="section-heading">
          <div>
            <span className="section-kicker">The Zorvellae journal</span>
            <h2>Dermatological Dispatches</h2>
          </div>
          <Link to="/ingredients" className="text-link">
            Read all monographs <ArrowRight size={13} aria-hidden="true" />
          </Link>
        </div>
        <div className="home-dispatch-grid">
          {dispatches.map((entry) => (
            <article className="home-dispatch-card" key={entry.id}>
              <span className="home-dispatch-image">
                <ResponsiveStoreImage
                  src={entry.image}
                  alt={entry.imageAlt}
                  sizes="(max-width: 768px) 92vw, 31vw"
                />
              </span>
              <span className="section-kicker">{entry.kicker}</span>
              <h3>{entry.title}</h3>
              <p className="home-dispatch-excerpt">{entry.excerpt}</p>
              <div className="home-dispatch-meta">
                <span>{entry.readTime}</span>
                <button
                  type="button"
                  className="text-link dispatch-read-button"
                  onClick={() => setActiveDispatch(entry)}
                >
                  Read monograph <ArrowRight size={12} aria-hidden="true" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="faq-section home-faq-section">
        <div className="home-centered-heading">
          <span className="section-kicker">Formulation integrity</span>
          <h2>Frequently Consulted Inquiries</h2>
        </div>
        <div className="faq-list">
          {faqs.map((faq) => (
            <details key={faq.question} open={faq.defaultOpen}>
              <summary>
                <span>{faq.question}</span>
                <span className="faq-chevron" aria-hidden="true">
                  ⌄
                </span>
              </summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="home-testimonials-section" aria-label="Client reflections">
        <div className="home-testimonials-grid">
          {testimonials.map((item) => (
            <article className="testimonial-card" key={item.author}>
              <div className="testimonial-stars" aria-label="5 out of 5 stars">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} size={11} fill="currentColor" aria-hidden="true" />
                ))}
              </div>
              <blockquote>{item.quote}</blockquote>
              <p className="testimonial-detail">{item.detail}</p>
              <div className="testimonial-author">
                <span className="testimonial-avatar" aria-hidden="true">
                  {item.initials}
                </span>
                <div>
                  <strong>{item.author}</strong>
                  <span>{item.role}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {diagnosticOpen && (
        <div className="store-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="diagnostic-modal-title">
          <div className="store-modal-panel">
            <div className="store-modal-header">
              <div>
                <span className="eyebrow">Precision prescription · {Math.min(diagnosticStep + 1, diagnosticQuestions.length)} of {diagnosticQuestions.length}</span>
                <h3 id="diagnostic-modal-title">
                  {diagnosticDone ? "Your Personalized Barrier Protocol" : currentQuestion?.prompt}
                </h3>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Close diagnostic"
                onClick={() => setDiagnosticOpen(false)}
              >
                <X size={18} />
              </Button>
            </div>

            {!diagnosticDone && currentQuestion ? (
              <div className="diagnostic-options-list">
                {currentQuestion.options.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className="diagnostic-option-button"
                    onClick={() => selectDiagnosticOption(currentQuestion.id, option.id)}
                  >
                    <span>{option.label}</span>
                    <ArrowRight size={14} aria-hidden="true" />
                  </button>
                ))}
                {diagnosticStep > 0 && (
                  <button
                    type="button"
                    className="text-link diagnostic-back-link"
                    onClick={() => setDiagnosticStep((step) => Math.max(0, step - 1))}
                  >
                    Previous question
                  </button>
                )}
              </div>
            ) : (
              <div className="diagnostic-results">
                <p className="diagnostic-results-lead">
                  Based on your responses, our formulation team recommends this bio-compatible ritual:
                </p>
                <div className="diagnostic-recommended-list">
                  {recommendedProducts.map((item) => (
                    <div className="diagnostic-recommended-item" key={item.id}>
                      <div>
                        <span className="eyebrow">{item.category_label}</span>
                        <strong>{item.name}</strong>
                        <p>{item.description}</p>
                      </div>
                      <div className="diagnostic-item-actions">
                        <span>{formatPrice(productStartingPrice(item), item.currency)}</span>
                        <Link
                          to="/product/$slug"
                          params={{ slug: item.slug }}
                          className="text-link"
                          onClick={() => setDiagnosticOpen(false)}
                        >
                          View details
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="diagnostic-footer-actions">
                  <Button
                    type="button"
                    className="store-link"
                    onClick={() => {
                      void (async () => {
                        for (const item of recommendedProducts) {
                          await addItem(item);
                        }
                        setDiagnosticOpen(false);
                      })();
                    }}
                  >
                    Add full protocol to bag
                  </Button>
                  <Button type="button" variant="outline" onClick={resetDiagnostic}>
                    Retake diagnostic
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeDispatch && (
        <div className="store-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="dispatch-modal-title">
          <div className="store-modal-panel">
            <div className="store-modal-header">
              <div>
                <span className="eyebrow">
                  {activeDispatch.kicker} · {activeDispatch.readTime}
                </span>
                <h3 id="dispatch-modal-title">{activeDispatch.title}</h3>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Close monograph"
                onClick={() => setActiveDispatch(null)}
              >
                <X size={18} />
              </Button>
            </div>
            <div className="dispatch-modal-body">
              {activeDispatch.article.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              <div className="dispatch-modal-footer">
                <Link
                  to="/ingredients"
                  className="store-link"
                  onClick={() => setActiveDispatch(null)}
                >
                  Explore full ingredient library <ArrowRight size={13} aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
      <button
        type="button"
        className={`back-to-top-fab ${
          showBackToTop && !diagnosticOpen && !activeDispatch ? "is-visible" : ""
        }`}
        aria-label="Back to top"
        title="Back to top"
        aria-hidden={!(showBackToTop && !diagnosticOpen && !activeDispatch)}
        tabIndex={showBackToTop && !diagnosticOpen && !activeDispatch ? 0 : -1}
        onClick={scrollToTop}
      >
        <ArrowUp size={16} aria-hidden="true" />
        <span className="back-to-top-label">Top</span>
      </button>
    </Storefront>
  );
}