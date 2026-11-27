import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, Check, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

import { PageHeading, ProductCard, Storefront, formatPrice, productStartingPrice, useStoreCart } from "@/components/storefront";
import { Button } from "@/components/ui/button";
import { catalogQueryOptions } from "@/lib/store-data";

type ConcernDossier = {
  id: string;
  label: string;
  kicker: string;
  title: string;
  summary: string;
  mechanism: string;
  signs: string;
  actives: string[];
  metricLabel: string;
  metricValue: string;
  metricPercent: number;
  metricFootnote: string;
  amSteps: string[];
  pmSteps: string[];
  productSlugs: string[];
  timeline: string;
};

const DEFAULT_CONCERN: ConcernDossier = {
  id: "barrier-depletion",
  label: "Barrier depletion",
  kicker: "Focus 01 · Epidermal Integrity",
  title: "Compromised Lipid Barrier & Sensitivity",
  summary: "Replenishes intercellular ceramides and calms reactivity caused by over-exfoliation, cold wind, or harsh surfactants.",
  mechanism:
    "When the stratum corneum loses its 3:1:1 ratio of ceramides, cholesterol, and free fatty acids, micro-fissures form between corneocytes—accelerating transepidermal water loss and triggering low-grade inflammation.",
  signs: "Flaking around the nose and cheeks, post-cleanse tightness, stinging upon serum application",
  actives: ["Bio-Ceramide III", "Signal Bio-Peptides", "Sugarcane Bio-Squalane", "Panthenol B5"],
  metricLabel: "Reduction in transepidermal water loss (28 days)",
  metricValue: "96%",
  metricPercent: 96,
  metricFootnote: "Measured via Tewameter evaluation across twice-daily barrier regimen use.",
  amSteps: ["Peptide Gentle Melt Cleanser", "Ceramide + Bio-Peptide Barrier Serum", "Squalane & Fermented Rosehip Cream"],
  pmSteps: ["Peptide Gentle Melt Cleanser", "Ceramide + Bio-Peptide Barrier Serum", "Squalane & Fermented Rosehip Cream (sealed layer)"],
  productSlugs: ["peptide-gentle-melt-cleanser", "ceramide-bio-peptide-barrier-serum", "squalane-fermented-rosehip-cream"],
  timeline: "7–14 days for comfort; 28 days for full lipid restoration",
};

const CONCERN_DOSSIERS: ConcernDossier[] = [
  DEFAULT_CONCERN,
  {
    id: "dehydration",
    label: "Dryness & dehydration",
    kicker: "Focus 02 · Moisture Retention",
    title: "Chronic Surface Dehydration & Tightness",
    summary: "Binds water across upper epidermal layers while sealing evaporation with biomimetic plant lipids.",
    mechanism:
      "Dehydrated skin lacks interstitial water even when surface oil appears normal. Humectants draw hydration inward, yet without an occlusive lipid veil, moisture escapes within hours.",
    signs: "Crepey mid-day texture, dull surface sheen, makeup settling into parched creases",
    actives: ["Multi-Molecular Hyaluronic Acid", "Colloidal Oat Beta-Glucan", "Fermented Rosehip Lipids"],
    metricLabel: "Sustained 48-hour hydration retention score",
    metricValue: "94%",
    metricPercent: 94,
    metricFootnote: "Corneometer readings comparing treated cheek zones against baseline.",
    amSteps: ["Peptide Gentle Melt Cleanser", "Ceramide + Bio-Peptide Barrier Serum (on damp skin)", "Squalane & Fermented Rosehip Cream"],
    pmSteps: ["Peptide Gentle Melt Cleanser", "Ceramide + Bio-Peptide Barrier Serum", "Squalane & Fermented Rosehip Cream"],
    productSlugs: ["ceramide-bio-peptide-barrier-serum", "squalane-fermented-rosehip-cream", "peptide-gentle-melt-cleanser"],
    timeline: "Immediate plumping within 24 hours; sustained balance in 2 weeks",
  },
  {
    id: "uneven-tone",
    label: "Uneven tone & dullness",
    kicker: "Focus 03 · Luminosity & Clarity",
    title: "Uneven Tone, Post-Blemish Marks & Dullness",
    summary: "Brightens sluggish surface tone and calms localized redness without acid-induced barrier stripping.",
    mechanism:
      "UV exposure and oxidative stress upregulate melanosome transfer to surrounding keratinocytes. Buffered Niacinamide and Alpine Edelweiss interrupt transfer pathways gently alongside botanical antioxidants.",
    signs: "Lingering post-spot shadowing, lackluster morning tone, patchy redness across cheeks",
    actives: ["10% Phyto-Niacinamide", "Alpine Edelweiss Meristem", "Fermented Licorice Root", "Ectoin"],
    metricLabel: "Visible improvement in tone evenness (6 weeks)",
    metricValue: "91%",
    metricPercent: 91,
    metricFootnote: "Assessed under cross-polarized clinical imaging at Week 6.",
    amSteps: ["Peptide Gentle Melt Cleanser", "Phyto-Niacinamide Radiance Elixir", "Squalane & Fermented Rosehip Cream"],
    pmSteps: ["Peptide Gentle Melt Cleanser", "Phyto-Niacinamide Radiance Elixir", "Ceramide + Bio-Peptide Barrier Serum"],
    productSlugs: ["phyto-niacinamide-radiance-elixir", "ceramide-bio-peptide-barrier-serum", "squalane-fermented-rosehip-cream"],
    timeline: "2 weeks for clearer brightness; 6 weeks for visible tone uniformity",
  },
  {
    id: "fine-lines",
    label: "Fine lines & bounce",
    kicker: "Focus 04 · Structural Resilience",
    title: "Early Fine Lines & Loss of Skin Bounce",
    summary: "Supports dermal density and softens expression lines using non-irritating bio-fermented signal peptides.",
    mechanism:
      "Repeated facial expression and glycation stiffen collagen cross-links while elastin renewal slows. Signal peptides encourage restorative matrix synthesis without the peeling cycle of aggressive retinoids.",
    signs: "Dehydration lines across forehead and cheeks, slower rebound after pinching, slack texture",
    actives: ["Signal Bio-Peptide Complex", "Acetyl Tetrapeptide-5", "Bio-Ceramide III", "Rosa Canina Ferment"],
    metricLabel: "Reported improvement in skin suppleness (8 weeks)",
    metricValue: "92%",
    metricPercent: 92,
    metricFootnote: "Self-assessed & cutometer firmness scores after twice-daily application.",
    amSteps: ["Peptide Gentle Melt Cleanser", "Ceramide + Bio-Peptide Barrier Serum", "Restorative Peptide Eye Balm"],
    pmSteps: ["Peptide Gentle Melt Cleanser", "Ceramide + Bio-Peptide Barrier Serum", "Squalane & Fermented Rosehip Cream"],
    productSlugs: ["ceramide-bio-peptide-barrier-serum", "restorative-peptide-eye-balm", "squalane-fermented-rosehip-cream"],
    timeline: "4 weeks for smoother texture; 8 weeks for firmer bounce",
  },
  {
    id: "sensitive-reactive",
    label: "Sensitive & reactive",
    kicker: "Focus 05 · Calming Architecture",
    title: "Heightened Sensitivity & Flushing Tendency",
    summary: "Essential-oil-free, fragrance-free formulas buffered at skin-neutral pH 5.2 to soothe flushed complexions.",
    mechanism:
      "Reactive skin exhibits lower nerve-ending activation thresholds when stripped by foaming sulfates or synthetic perfume. Amino-acid surfactants and Centella triterpenes calm neurogenic flare signals.",
    signs: "Warm flushing after cleansing, itching in dry air, intolerance to conventional actives",
    actives: ["Centella Asiatica Triterpenes", "Colloidal Oat Beta-Glucan", "Zinc PCA", "Bio-Ceramide III"],
    metricLabel: "Users reporting zero stinging or irritation",
    metricValue: "100%",
    metricPercent: 100,
    metricFootnote: "Validated via 48-hour occluded patch testing on sensitive skin panels.",
    amSteps: ["Peptide Gentle Melt Cleanser", "Ceramide + Bio-Peptide Barrier Serum", "Squalane & Fermented Rosehip Cream"],
    pmSteps: ["Peptide Gentle Melt Cleanser (lukewarm rinse)", "Squalane & Fermented Rosehip Cream"],
    productSlugs: ["peptide-gentle-melt-cleanser", "ceramide-bio-peptide-barrier-serum", "squalane-fermented-rosehip-cream"],
    timeline: "48 hours for calmer post-wash feel; 3 weeks for raised tolerance",
  },
  {
    id: "orbital-fatigue",
    label: "Orbital fatigue & circles",
    kicker: "Focus 06 · Periorbital Zone",
    title: "Under-Eye Puffiness, Shadows & Creping",
    summary: "Micro-peptides and bio-fermented caffeine support micro-circulation around thin, delicate periorbital tissue.",
    mechanism:
      "Periorbital skin is roughly 0.5mm thick with minimal sebaceous glands, making fluid stasis, vascular shadowing, and fine squint lines immediately visible after poor sleep or salt intake.",
    signs: "Morning puffiness below lower lashes, shadowy tear troughs, dry concealer creasing",
    actives: ["Bio-Fermented Caffeine", "Acetyl Tetrapeptide-5", "Escin", "Meadowfoam Seed Oil"],
    metricLabel: "Reduction in visible morning puffiness (28 days)",
    metricValue: "89%",
    metricPercent: 89,
    metricFootnote: "Measured at morning clinical check-ins after gentle orbital ring-finger application.",
    amSteps: ["Peptide Gentle Melt Cleanser", "Restorative Peptide Eye Balm", "Phyto-Niacinamide Radiance Elixir"],
    pmSteps: ["Peptide Gentle Melt Cleanser", "Restorative Peptide Eye Balm", "Squalane & Fermented Rosehip Cream"],
    productSlugs: ["restorative-peptide-eye-balm", "phyto-niacinamide-radiance-elixir", "peptide-gentle-melt-cleanser"],
    timeline: "Immediate de-puffing sensation; 4 weeks for smoother orbital skin",
  },
];

const COMPATIBILITY_NOTES = [
  {
    question: "Can I pair Phyto-Niacinamide Radiance Elixir with Bio-Peptide Barrier Serum?",
    answer:
      "Yes. Both are buffered at skin-compatible pH (5.2–5.8) and act on complementary pathways: peptides rebuild structural integrity while Niacinamide regulates pigment transfer and surface sebum. Apply the Radiance Elixir first in the morning and follow with the Barrier Serum.",
  },
  {
    question: "How should I introduce actives if my barrier currently stings?",
    answer:
      "Begin with a 10-day reset using only Peptide Gentle Melt Cleanser followed by Ceramide + Bio-Peptide Barrier Serum and Squalane & Fermented Rosehip Cream on damp skin. Once post-cleanse tightness subsides, introduce targeted treatment drops every other morning.",
  },
  {
    question: "What ingredients does ZORVELLAE intentionally exclude for sensitive rhythms?",
    answer:
      "Every ZORVELLAE formula excludes drying denatured alcohols, sulfates (SLS/SLES), synthetic fragrance, essential oil allergens, silicones, and harsh micro-exfoliants—preventing cumulative irritation across multi-step routines.",
  },
];

export const Route = createFileRoute("/skin-concerns")({
  head: () => ({
    meta: [
      { title: "Skin Concerns — ZORVELLAE" },
      {
        name: "description",
        content: "Explore ZORVELLAE's clinical skin concern index with targeted bio-actives, AM/PM layering sequences, and proven formulations.",
      },
      { property: "og:title", content: "Skin Concerns — ZORVELLAE" },
      { property: "og:description", content: "Targeted botanical clinical guidance for barrier repair, hydration, uneven tone, and sensitivity." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogQueryOptions(undefined, false)),
  component: SkinConcernsPage,
});

function SkinConcernsPage() {
  const { data: products } = useSuspenseQuery(catalogQueryOptions(undefined, false));
  const { addItem } = useStoreCart();
  const [selectedConcernId, setSelectedConcernId] = useState<string>(DEFAULT_CONCERN.id);

  const activeConcern = useMemo(
    () => CONCERN_DOSSIERS.find((entry) => entry.id === selectedConcernId) ?? DEFAULT_CONCERN,
    [selectedConcernId],
  );

  const matchedProducts = useMemo(() => {
    const bySlug = new Map(products.map((product) => [product.slug, product]));
    const resolved = activeConcern.productSlugs
      .map((slug) => bySlug.get(slug))
      .filter((item): item is NonNullable<typeof item> => Boolean(item));
    return resolved.length > 0 ? resolved : products.slice(0, 3);
  }, [activeConcern.productSlugs, products]);

  const protocolTotal = useMemo(
    () => matchedProducts.reduce((sum, product) => sum + productStartingPrice(product), 0),
    [matchedProducts],
  );

  async function handleAddProtocol() {
    if (matchedProducts.length === 0) return;
    for (const product of matchedProducts) {
      await addItem(product);
    }
    toast.success(`${activeConcern.label} regimen added to your bag.`);
  }

  function handleSelectFromDirectory(concernId: string) {
    setSelectedConcernId(concernId);
    const el = document.getElementById("concern-dossier");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <Storefront>
      <section className="catalog-banner">
        <PageHeading
          eyebrow="Dermatological Concern Index"
          title={
            <>
              Targeted care for your skin&apos;s <em>daily rhythms.</em>
            </>
          }
          description="Select a primary skin concern to inspect its epidermal mechanism, key botanical bio-actives, clinical recovery metrics, and curated formulation protocol."
          imageSrc="/site-assets/zorvellae-science.webp"
          imageAlt="ZORVELLAE botanical clinical skincare bottles arranged on natural stone"
        />
      </section>

      <section id="concern-dossier" className="concerns-workspace-section">
        <div className="concerns-workspace-inner">
          <div className="section-heading section-heading-split">
            <div>
              <span className="section-kicker">Interactive Protocol Finder</span>
              <h2>Select your primary concern.</h2>
            </div>
            <p className="section-heading-aside">
              Each focus pairs non-stripping surfactants, skin-identical lipids, and buffered actives calibrated for daily barrier tolerance.
            </p>
          </div>

          <div className="concern-tab-strip" role="tablist" aria-label="Skin concern selector">
            {CONCERN_DOSSIERS.map((concern) => {
              const isSelected = concern.id === activeConcern.id;
              return (
                <button
                  key={concern.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  className={`concern-tab-button ${isSelected ? "is-active" : ""}`}
                  onClick={() => setSelectedConcernId(concern.id)}
                >
                  {concern.label}
                </button>
              );
            })}
          </div>

          <article className="concern-dossier-panel" role="tabpanel" aria-label={activeConcern.title}>
            <div className="concern-dossier-grid">
              <div className="concern-dossier-main">
                <span className="section-kicker">{activeConcern.kicker}</span>
                <h3>{activeConcern.title}</h3>
                <p className="concern-dossier-lead">{activeConcern.summary}</p>

                <div className="concern-detail-blocks">
                  <div className="concern-detail-block">
                    <span className="concern-detail-label">Epidermal mechanism</span>
                    <p>{activeConcern.mechanism}</p>
                  </div>
                  <div className="concern-detail-block">
                    <span className="concern-detail-label">Visible signs &amp; expected horizon</span>
                    <p>
                      {activeConcern.signs} <span aria-hidden="true">·</span> {activeConcern.timeline}
                    </p>
                  </div>
                </div>

                <div className="concern-actives-row">
                  <span className="concern-detail-label">Priority bio-actives</span>
                  <p className="concern-actives-inline">
                    {activeConcern.actives.map((active, index) => (
                      <span key={active}>
                        {index > 0 && <span aria-hidden="true"> · </span>}
                        <Link to="/ingredients">{active}</Link>
                      </span>
                    ))}
                  </p>
                </div>
              </div>

              <div className="concern-dossier-aside">
                <div className="concern-metric-box">
                  <div className="home-metric-head">
                    <span className="home-metric-label">{activeConcern.metricLabel}</span>
                    <strong className="home-metric-value">{activeConcern.metricValue}</strong>
                  </div>
                  <div className="home-metric-bar" aria-hidden="true">
                    <span style={{ width: `${activeConcern.metricPercent}%` }} />
                  </div>
                  <p className="home-metric-note">{activeConcern.metricFootnote}</p>
                </div>

                <div className="concern-sequence-grid">
                  <div>
                    <span className="concern-detail-label">Morning sequence</span>
                    <ol className="concern-sequence-list">
                      {activeConcern.amSteps.map((step) => (
                        <li key={`am-${step}`}>
                          <Check size={12} aria-hidden="true" />
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                  <div>
                    <span className="concern-detail-label">Evening sequence</span>
                    <ol className="concern-sequence-list">
                      {activeConcern.pmSteps.map((step) => (
                        <li key={`pm-${step}`}>
                          <Check size={12} aria-hidden="true" />
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              </div>
            </div>

            <div className="concern-matched-shelf">
              <div className="concern-shelf-header">
                <div>
                  <span className="section-kicker">Matched Formulations · {matchedProducts.length} Steps</span>
                  <h4>Recommended for {activeConcern.label.toLowerCase()}</h4>
                </div>
                <div className="concern-shelf-actions">
                  {matchedProducts.length > 0 && (
                    <Button type="button" className="store-link" onClick={() => void handleAddProtocol()}>
                      <ShoppingBag size={13} aria-hidden="true" />
                      Add {matchedProducts.length}-step regimen ({formatPrice(protocolTotal)})
                    </Button>
                  )}
                  <Link className="text-link" to="/shop">
                    Browse all formulations <ArrowRight size={13} aria-hidden="true" />
                  </Link>
                </div>
              </div>

              <div className="concern-product-grid">
                {matchedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} onQuickAdd />
                ))}
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="concerns-directory-section">
        <div className="concerns-directory-inner">
          <div className="section-heading section-heading-split">
            <div>
              <span className="section-kicker">Complete Clinical Matrix</span>
              <h2>Compare all six skin concerns.</h2>
            </div>
            <Link className="text-link" to="/ingredients">
              Explore full ingredient library <ArrowRight size={13} aria-hidden="true" />
            </Link>
          </div>

          <div className="concern-directory-grid">
            {CONCERN_DOSSIERS.map((concern) => {
              const isSelected = concern.id === activeConcern.id;
              return (
                <button
                  key={concern.id}
                  type="button"
                  className={`concern-directory-card ${isSelected ? "is-selected" : ""}`}
                  onClick={() => handleSelectFromDirectory(concern.id)}
                >
                  <div className="concern-directory-top">
                    <span className="section-kicker">{concern.kicker}</span>
                    <span className="concern-directory-metric">{concern.metricValue} clinical benchmark</span>
                  </div>
                  <h3>{concern.label}</h3>
                  <p>{concern.summary}</p>
                  <div className="concern-directory-footer">
                    <span>{concern.actives.slice(0, 2).join(" · ")}</span>
                    <span className="concern-directory-action">
                      View protocol <ArrowRight size={12} aria-hidden="true" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="concerns-guidance-section">
        <div className="concerns-guidance-inner">
          <div className="home-centered-heading">
            <span className="section-kicker">Formulation Compatibility</span>
            <h2>Layering principles &amp; tolerance notes.</h2>
            <p>
              Practical clinical guidance on pairing ZORVELLAE treatments safely across morning and evening rituals.
            </p>
          </div>

          <div className="faq-list">
            {COMPATIBILITY_NOTES.map((item, idx) => (
              <details key={item.question} open={idx === 0}>
                <summary>
                  <span>{item.question}</span>
                  <span className="faq-chevron" aria-hidden="true">⌄</span>
                </summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </div>

        <div className="home-diagnostic-banner concern-cta-band concern-cta-split">
          <div className="home-diagnostic-copy">
            <span className="section-kicker">Precision Routine Building</span>
            <h2>Ready to assemble your daily ritual?</h2>
            <p>
              Explore our step-by-step morning and evening cadence or speak directly with our formulation specialists for individual sensitivity questions.
            </p>
            <div className="home-diagnostic-actions">
              <Link className="store-link" to="/routines">
                View four-step routines
              </Link>
              <Link className="store-link store-link-outline" to="/contact">
                Consult our team
              </Link>
            </div>
          </div>
          <figure className="concern-cta-media">
            <img
              src="/site-assets/generated/consultation_skincare_specialist_1795752504253.jpg"
              alt="ZORVELLAE skincare formulation consultant guiding a personalized ritual consultation"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          </figure>
        </div>
      </section>
    </Storefront>
  );
}