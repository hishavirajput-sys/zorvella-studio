import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, Clock, Droplets, ShoppingBag, SunMoon } from "lucide-react";
import { toast } from "sonner";

import { ResponsiveStoreImage } from "@/components/responsive-image";
import { PageHeading, Storefront, formatPrice, isPurchasableProduct, productStartingPrice, useStoreCart } from "@/components/storefront";
import { Button } from "@/components/ui/button";
import { catalogQueryOptions } from "@/lib/store-data";

type RoutineStepSpec = {
  stepNumber: string;
  label: string;
  timing: string;
  title: string;
  technique: string;
  dosage: string;
  image: string;
  imageAlt: string;
  productSlug: string;
  categorySlug: string;
};

type RoutineCadence = {
  id: string;
  tabLabel: string;
  kicker: string;
  title: string;
  summary: string;
  durationNote: string;
  steps: RoutineStepSpec[];
};

const MORNING_CADENCE: RoutineCadence = {
  id: "morning-defense",
  tabLabel: "Morning defense (AM)",
  kicker: "AM Cadence · Antioxidant & Barrier Shield",
  title: "Morning Luminous Defense",
  summary: "Lightweight, fast-absorbing hydration calibrated to buffer environmental stress and sit invisibly beneath daily sunscreen.",
  durationNote: "3 minutes · 4 steps",
  steps: [
    {
      stepNumber: "01",
      label: "Cleanse",
      timing: "45 seconds · Lukewarm rinse",
      title: "Amino-Acid Barrier Wash",
      technique: "Emulsify between wet palms and massage gently without stripping overnight surface lipids. Pat lightly so skin remains damp.",
      dosage: "1–2 pumps",
      image: "/site-assets/generated/product_melt_cleanser_1795670127118.jpg",
      imageAlt: "Peptide Gentle Melt Cleanser prepared for morning cleansing",
      productSlug: "peptide-gentle-melt-cleanser",
      categorySlug: "cleansers",
    },
    {
      stepNumber: "02",
      label: "Treat",
      timing: "While skin is damp",
      title: "Phyto-Niacinamide Tone Balancing",
      technique: "Press evenly across cheeks, T-zone, and neck to calm morning redness and support bright, even clarity throughout the day.",
      dosage: "3 drops",
      image: "/site-assets/generated/product_radiance_elixir_1795670125654.jpg",
      imageAlt: "Phyto-Niacinamide Radiance Elixir amber dropper",
      productSlug: "phyto-niacinamide-radiance-elixir",
      categorySlug: "serums",
    },
    {
      stepNumber: "03",
      label: "Eye Care",
      timing: "Gentle ring-finger tap",
      title: "Periorbital De-Puffing",
      technique: "Trace softly along the orbital bone from inner corner to temple to ease morning fluid stasis without tugging thin tissue.",
      dosage: "Grain-of-rice amount",
      image: "/site-assets/generated/product_eye_balm_1795670126729.jpg",
      imageAlt: "Restorative Peptide Eye Balm container on stone tray",
      productSlug: "restorative-peptide-eye-balm",
      categorySlug: "eye-care",
    },
    {
      stepNumber: "04",
      label: "Hydrate",
      timing: "Seal before SPF",
      title: "Biomimetic Lipid Cushion",
      technique: "Warm lightly between fingertips and press across face so ceramides and squalane cushion skin beneath daytime sun protection.",
      dosage: "Pearl-sized measure",
      image: "/site-assets/generated/product_rosehip_cream_1795670125752.jpg",
      imageAlt: "Squalane & Fermented Rosehip Cream glass jar",
      productSlug: "squalane-fermented-rosehip-cream",
      categorySlug: "barrier-creams",
    },
  ],
};

const EVENING_CADENCE: RoutineCadence = {
  id: "evening-repair",
  tabLabel: "Evening recovery (PM)",
  kicker: "PM Cadence · Cellular & Lipid Repair",
  title: "Overnight Barrier Restoration",
  summary: "Maximizes nocturnal skin permeability with concentrated Bio-Ceramide III and overnight rosehip lipids while transepidermal water loss peaks.",
  durationNote: "4 minutes · 4 steps",
  steps: [
    {
      stepNumber: "01",
      label: "Cleanse",
      timing: "60 seconds · Thorough melt",
      title: "Suspended Impurities Removal",
      technique: "Massage slowly over dry or damp skin to dissolve mineral sunscreen and urban particulate matter without triggering tightness.",
      dosage: "2 full pumps",
      image: "/site-assets/generated/product_melt_cleanser_1795670127118.jpg",
      imageAlt: "Peptide Gentle Melt Cleanser evening cleanse bottle",
      productSlug: "peptide-gentle-melt-cleanser",
      categorySlug: "cleansers",
    },
    {
      stepNumber: "02",
      label: "Repair",
      timing: "Immediate absorption window",
      title: "Ceramide + Bio-Peptide Concentrate",
      technique: "Smooth 3–4 drops across face and neck right after towel blotting to replenish intercellular 3:1:1 lipids overnight.",
      dosage: "3–4 drops",
      image: "/site-assets/generated/product_barrier_serum_1795670125183.jpg",
      imageAlt: "Ceramide + Bio-Peptide Barrier Serum treatment bottle",
      productSlug: "ceramide-bio-peptide-barrier-serum",
      categorySlug: "serums",
    },
    {
      stepNumber: "03",
      label: "Eye Care",
      timing: "20 seconds · Zero friction",
      title: "Overnight Peptide Support",
      technique: "Press softly below the lash line and outer brow bone to reinforce delicate elastin networks during sleep.",
      dosage: "Half-pea measure",
      image: "/site-assets/generated/product_eye_balm_1795670126729.jpg",
      imageAlt: "Restorative Peptide Eye Balm jar",
      productSlug: "restorative-peptide-eye-balm",
      categorySlug: "eye-care",
    },
    {
      stepNumber: "04",
      label: "Seal",
      timing: "Final occlusive layer",
      title: "Fermented Lipid Lock",
      technique: "Apply an enveloping layer of Squalane & Fermented Rosehip Cream to reduce overnight transepidermal evaporation.",
      dosage: "Generous pearl measure",
      image: "/site-assets/generated/product_rosehip_cream_1795670125752.jpg",
      imageAlt: "Squalane & Fermented Rosehip Cream rich barrier cream",
      productSlug: "squalane-fermented-rosehip-cream",
      categorySlug: "barrier-creams",
    },
  ],
};

const RESET_CADENCE: RoutineCadence = {
  id: "barrier-reset",
  tabLabel: "Sensitive barrier reset",
  kicker: "Recovery Cadence · Minimum Friction",
  title: "Minimalist 3-Step Sensitivity Reset",
  summary: "Designed for post-procedure skin, seasonal windburn, or over-exfoliated barriers needing uninterrupted calm.",
  durationNote: "2 minutes · 3 steps",
  steps: [
    {
      stepNumber: "01",
      label: "Cleanse",
      timing: "Evening only · Tepid water",
      title: "Non-Foaming Calming Wash",
      technique: "Skip morning surfactant cleansing with water rinse only; use Melt Cleanser strictly at night for 10–14 days.",
      dosage: "1 pump",
      image: "/site-assets/generated/product_melt_cleanser_1795670127118.jpg",
      imageAlt: "Peptide Gentle Melt Cleanser mild cleansing emulsion",
      productSlug: "peptide-gentle-melt-cleanser",
      categorySlug: "cleansers",
    },
    {
      stepNumber: "02",
      label: "Rebuild",
      timing: "Morning & Evening",
      title: "Direct Lipid Replenishment",
      technique: "Pat Ceramide + Bio-Peptide Barrier Serum slowly into skin without rubbing until surface redness softens.",
      dosage: "3 drops",
      image: "/site-assets/generated/product_barrier_serum_1795670125183.jpg",
      imageAlt: "Ceramide + Bio-Peptide Barrier Serum soothing bottle",
      productSlug: "ceramide-bio-peptide-barrier-serum",
      categorySlug: "serums",
    },
    {
      stepNumber: "03",
      label: "Shield",
      timing: "Morning & Evening",
      title: "Ceramide Moisture Occlusion",
      technique: "Seal hydration immediately with Squalane & Fermented Rosehip Cream to insulate nerve endings against cold or dry air.",
      dosage: "Pearl-sized measure",
      image: "/site-assets/generated/product_rosehip_cream_1795670125752.jpg",
      imageAlt: "Squalane & Fermented Rosehip Cream soothing moisturizer",
      productSlug: "squalane-fermented-rosehip-cream",
      categorySlug: "barrier-creams",
    },
  ],
};

const ROUTINE_CADENCES: RoutineCadence[] = [MORNING_CADENCE, EVENING_CADENCE, RESET_CADENCE];

const RITUAL_BUNDLES = [
  {
    id: "barrier-recovery-suite",
    badge: "Save $26",
    eyebrow: "Barrier Architecture · Complete 3-Step",
    title: "The Barrier Recovery Suite",
    description: "Designed for sensitized, dehydrated, or over-exfoliated skin requiring deep lipid restoration.",
    steps: ["Peptide Gentle Melt Cleanser", "Ceramide + Bio-Peptide Serum", "Squalane Rosehip Cream"],
    price: "$158.00",
    compareAt: "$184.00",
    image: "/site-assets/generated/product_rosehip_cream_1795670125752.jpg",
    imageAlt: "The Barrier Recovery Suite bottles curated on stone",
    productSlugs: ["peptide-gentle-melt-cleanser", "ceramide-bio-peptide-barrier-serum", "squalane-fermented-rosehip-cream"],
  },
  {
    id: "am-pm-radiance-system",
    badge: "Save $26",
    eyebrow: "Luminous & Bright · 3-Step System",
    title: "Complete AM / PM Radiance System",
    description: "Dual antioxidant brightening and evening hydration for supple, glass-smooth tone clarity.",
    steps: ["Phyto-Niacinamide Elixir", "Restorative Peptide Eye Balm", "Peptide Gentle Melt Cleanser"],
    price: "$142.00",
    compareAt: "$168.00",
    image: "/site-assets/generated/product_radiance_elixir_1795670125654.jpg",
    imageAlt: "Complete AM PM Radiance System skincare bottles",
    productSlugs: ["phyto-niacinamide-radiance-elixir", "restorative-peptide-eye-balm", "peptide-gentle-melt-cleanser"],
  },
];

const CADENCE_PRINCIPLES = [
  {
    icon: Droplets,
    kicker: "Principle 01 · Thinnest to Richest",
    title: "Viscosity Dictates Absorption",
    body: "Water-based bio-peptides and Phyto-Niacinamide serums penetrate first cleanly; lipid-rich squalane creams follow last to lock active hydration beneath a breathable seal.",
  },
  {
    icon: Clock,
    kicker: "Principle 02 · 60-Second Window",
    title: "Apply Onto Damp Skin",
    body: "Towel-pat gently rather than rubbing completely dry. Humectants bind residual surface moisture directly into the upper stratum corneum within the first minute.",
  },
  {
    icon: SunMoon,
    kicker: "Principle 03 · 28-Day Cellular Cycle",
    title: "Consistent Low-Friction Cadence",
    body: "Skin barrier lipids turn over every 28 days. Steady twice-daily gentle application outperforms aggressive periodic peels for long-term elasticity and tone.",
  },
];

const ROUTINE_FAQS = [
  {
    question: "How long should I wait between applying serum and moisturizer?",
    answer:
      "Wait roughly 30 to 45 seconds—until your serum feels dewy rather than wet—before pressing on your barrier cream. This avoids pilling while locking moisture in before evaporation.",
  },
  {
    question: "Where does daily broad-spectrum sunscreen fit into the morning cadence?",
    answer:
      "Always apply sunscreen as the final step after Squalane & Fermented Rosehip Cream has settled for 2–3 minutes so UV filters form an even protective film.",
  },
  {
    question: "Can I alternate between Ceramide Serum and Phyto-Niacinamide Elixir?",
    answer:
      "Yes. Many clients use Phyto-Niacinamide Radiance Elixir every morning for brightness and environmental defense, and reserve Ceramide + Bio-Peptide Barrier Serum for overnight recovery.",
  },
];

export const Route = createFileRoute("/routines")({
  head: () => ({
    meta: [
      { title: "Skincare Routines — ZORVELLAE" },
      { name: "description", content: "Explore morning, evening, and barrier-reset skincare cadences built around ZORVELLAE formulations." },
      { property: "og:title", content: "Skincare Routines — ZORVELLAE" },
      { property: "og:description", content: "Considered AM/PM layering sequences for cleanse, treat, eye care, and hydrate steps." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogQueryOptions(undefined, false)),
  component: RoutinesPage,
});

function RoutinesPage() {
  const { data: products } = useSuspenseQuery(catalogQueryOptions(undefined, false));
  const { addItem } = useStoreCart();
  const [activeCadenceId, setActiveCadenceId] = useState<string>(MORNING_CADENCE.id);

  const productBySlug = useMemo(() => new Map(products.map((product) => [product.slug, product])), [products]);

  const activeCadence = useMemo(
    () => ROUTINE_CADENCES.find((cadence) => cadence.id === activeCadenceId) ?? MORNING_CADENCE,
    [activeCadenceId],
  );

  const cadenceProducts = useMemo(
    () =>
      activeCadence.steps
        .map((step) => productBySlug.get(step.productSlug))
        .filter((item): item is NonNullable<typeof item> => Boolean(item)),
    [activeCadence.steps, productBySlug],
  );

  const cadenceTotal = useMemo(
    () => cadenceProducts.reduce((sum, product) => sum + productStartingPrice(product), 0),
    [cadenceProducts],
  );

  async function handleAddFullCadence() {
    if (cadenceProducts.length === 0) return;
    for (const product of cadenceProducts) {
      await addItem(product);
    }
    toast.success(`${activeCadence.title} steps added to your bag.`);
  }

  async function handleAddRitualBundle(title: string, slugs: string[]) {
    const matched = slugs
      .map((slug) => productBySlug.get(slug))
      .filter((item): item is NonNullable<typeof item> => Boolean(item));
    if (matched.length === 0) {
      toast.info("These formulations are currently being restocked.");
      return;
    }
    for (const product of matched) {
      await addItem(product);
    }
    toast.success(`${title} added to your bag.`);
  }

  return (
    <Storefront>
      <section className="catalog-banner">
        <PageHeading
          eyebrow="Ritual Architecture · AM / PM"
          title={
            <>
              Your skin. <em>Your daily cadence.</em>
            </>
          }
          description="Sequenced morning, evening, and sensitive recovery routines designed to layer weightlessly from water-soluble actives to barrier-sealing botanical lipids."
          imageSrc="/site-assets/home/step-treat.webp"
          imageAlt="ZORVELLAE skincare serums arranged in an editorial morning ritual sequence"
        />
      </section>

      <section className="routine-builder-section">
        <div className="routine-builder-inner">
          <div className="section-heading section-heading-split">
            <div>
              <span className="section-kicker">Step-by-Step Sequencing</span>
              <h2>Choose your daily cadence.</h2>
            </div>
            <p className="section-heading-aside">
              Switch between morning defense, overnight recovery, and a stripped-back barrier reset—each paired directly with verified ZORVELLAE formulas.
            </p>
          </div>

          <div className="routine-cadence-bar">
            <div className="concern-tab-strip routine-tab-strip" role="tablist" aria-label="Skincare routine cadence">
              {ROUTINE_CADENCES.map((cadence) => {
                const selected = cadence.id === activeCadence.id;
                return (
                  <button
                    key={cadence.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    className={`concern-tab-button ${selected ? "is-active" : ""}`}
                    onClick={() => setActiveCadenceId(cadence.id)}
                  >
                    {cadence.tabLabel}
                  </button>
                );
              })}
            </div>
            {cadenceProducts.length > 0 && (
              <Button type="button" className="store-link routine-add-all-btn" onClick={() => void handleAddFullCadence()}>
                <ShoppingBag size={13} aria-hidden="true" />
                Add {activeCadence.steps.length}-step ritual ({formatPrice(cadenceTotal)})
              </Button>
            )}
          </div>

          <div className="routine-cadence-header">
            <div>
              <span className="section-kicker">{activeCadence.kicker}</span>
              <h3>{activeCadence.title}</h3>
              <p>{activeCadence.summary}</p>
            </div>
            <span className="routine-duration-label">{activeCadence.durationNote}</span>
          </div>

          <div className={`routine-steps-grid ${activeCadence.steps.length === 3 ? "is-three-cols" : ""}`}>
            {activeCadence.steps.map((step) => {
              const linkedProduct = productBySlug.get(step.productSlug);
              const canPurchase = linkedProduct ? isPurchasableProduct(linkedProduct) : false;
              return (
                <article className="routine-step-card" key={`${activeCadence.id}-${step.stepNumber}`}>
                  <div className="routine-step-media">
                    <ResponsiveStoreImage
                      src={step.image}
                      alt={step.imageAlt}
                      sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 24vw"
                    />
                    <span className="step-index">
                      Step {step.stepNumber} · {step.label}
                    </span>
                  </div>
                  <div className="routine-step-body">
                    <span className="routine-step-meta">
                      {step.timing} <span aria-hidden="true">·</span> {step.dosage}
                    </span>
                    <h4>{step.title}</h4>
                    <p>{step.technique}</p>

                    {linkedProduct ? (
                      <div className="routine-step-product">
                        <Link to="/product/$slug" params={{ slug: linkedProduct.slug }} className="routine-product-link">
                          {linkedProduct.name}
                        </Link>
                        <div className="routine-product-bottom">
                          <span className="product-price">{formatPrice(productStartingPrice(linkedProduct), linkedProduct.currency)}</span>
                          <Button
                            type="button"
                            size="sm"
                            disabled={!canPurchase}
                            className="brand-button product-add-button"
                            onClick={() => void addItem(linkedProduct)}
                          >
                            {canPurchase ? "Quick add" : "Unavailable"}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="routine-step-product">
                        <Link className="text-link" to="/shop/category/$slug" params={{ slug: step.categorySlug }}>
                          Explore category <ArrowRight size={12} aria-hidden="true" />
                        </Link>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="home-ritual-section routine-bundles-surface">
        <div className="section-heading section-heading-split">
          <div>
            <span className="section-kicker">Complete Formulation Pairings</span>
            <h2>Curated Clinical Rituals</h2>
          </div>
          <Link className="text-link" to="/skin-concerns">
            Match by skin concern <ArrowRight size={13} aria-hidden="true" />
          </Link>
        </div>

        <div className="home-ritual-feature-grid">
          {RITUAL_BUNDLES.map((ritual) => (
            <article className="home-ritual-feature" key={ritual.id}>
              <div className="home-ritual-image">
                <ResponsiveStoreImage
                  src={ritual.image}
                  alt={ritual.imageAlt}
                  sizes="(max-width: 768px) 92vw, 44vw"
                />
                <span className="ritual-saving-tag">{ritual.badge}</span>
              </div>
              <div className="home-ritual-copy">
                <div>
                  <span className="section-kicker">{ritual.eyebrow}</span>
                  <h3>{ritual.title}</h3>
                  <ul className="ritual-steps-list">
                    {ritual.steps.map((stepName) => (
                      <li key={stepName}>{stepName}</li>
                    ))}
                  </ul>
                  <p>{ritual.description}</p>
                </div>
                <div className="ritual-footer-row">
                  <div className="ritual-price-stack">
                    <strong>{ritual.price}</strong>
                    <span>{ritual.compareAt}</span>
                  </div>
                  <Button
                    type="button"
                    className="store-link ritual-action-button"
                    onClick={() => void handleAddRitualBundle(ritual.title, ritual.productSlugs)}
                  >
                    Shop the ritual <ArrowRight size={13} aria-hidden="true" />
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="routine-principles-section">
        <div className="routine-principles-inner">
          <div className="home-centered-heading">
            <span className="section-kicker">Clinical Layering Discipline</span>
            <h2>Three principles behind every routine.</h2>
          </div>

          <div className="home-standards-grid routine-principles-grid">
            {CADENCE_PRINCIPLES.map((principle) => {
              const Icon = principle.icon;
              return (
                <article key={principle.title}>
                  <span className="home-standard-mark" aria-hidden="true">
                    <Icon />
                  </span>
                  <span className="section-kicker">{principle.kicker}</span>
                  <h3>{principle.title}</h3>
                  <p>{principle.body}</p>
                </article>
              );
            })}
          </div>

          <div className="concerns-guidance-inner routine-faq-wrap">
            <div className="faq-list">
              {ROUTINE_FAQS.map((faq, index) => (
                <details key={faq.question} open={index === 0}>
                  <summary>
                    <span>{faq.question}</span>
                    <span className="faq-chevron" aria-hidden="true">⌄</span>
                  </summary>
                  <p>{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>

          <div className="home-diagnostic-banner concern-cta-band concern-cta-split">
            <div className="home-diagnostic-copy">
              <span className="section-kicker">Targeted Dermatological Guidance</span>
              <h2>Building a routine for a specific concern?</h2>
              <p>
                Explore our clinical Skin Concerns index to inspect active pathways or reach our formulation specialists directly.
              </p>
              <div className="home-diagnostic-actions">
                <Link className="store-link" to="/skin-concerns">
                  Explore skin concerns
                </Link>
                <Link className="store-link store-link-outline" to="/shop">
                  Browse all formulations
                </Link>
              </div>
            </div>
            <div className="routine-bundle-cluster" aria-label="Complete four-step skincare routine bundle">
              <figure className="routine-bundle-tile">
                <ResponsiveStoreImage
                  src="/site-assets/generated/product_melt_cleanser_1795670127118.jpg"
                  alt="Peptide Gentle Melt Cleanser"
                  sizes="(max-width: 640px) 44vw, 220px"
                />
                <figcaption>01 · Melt Cleanser</figcaption>
              </figure>
              <figure className="routine-bundle-tile">
                <ResponsiveStoreImage
                  src="/site-assets/generated/product_barrier_serum_1795670125183.jpg"
                  alt="Ceramide Bio-Peptide Barrier Serum"
                  sizes="(max-width: 640px) 44vw, 220px"
                />
                <figcaption>02 · Barrier Serum</figcaption>
              </figure>
              <figure className="routine-bundle-tile">
                <ResponsiveStoreImage
                  src="/site-assets/generated/product_rosehip_cream_1795670125752.jpg"
                  alt="Squalane Fermented Rosehip Cream"
                  sizes="(max-width: 640px) 44vw, 220px"
                />
                <figcaption>03 · Rosehip Cream</figcaption>
              </figure>
              <figure className="routine-bundle-tile">
                <ResponsiveStoreImage
                  src="/site-assets/generated/product_eye_balm_1795670126729.jpg"
                  alt="Restorative Peptide Eye Balm"
                  sizes="(max-width: 640px) 44vw, 220px"
                />
                <figcaption>04 · Peptide Eye Balm</figcaption>
              </figure>
            </div>
          </div>
        </div>
      </section>
    </Storefront>
  );
}