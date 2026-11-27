import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, Check, FlaskConical, Microscope, ShieldCheck } from "lucide-react";

import { ResponsiveStoreImage } from "@/components/responsive-image";
import { PageHeading, Storefront } from "@/components/storefront";
import { publishedPageContentQueryOptions } from "@/lib/page-content";

const LAB_STANDARDS = [
  {
    icon: FlaskConical,
    kicker: "Standard 01 · Lamellar Fidelity",
    title: "3:1:1 Biomimetic Lipid Ratio",
    body: "Every barrier emulsion replicates the native stratum corneum balance of ceramides, free fatty acids, and cholesterol so compromised skin integrates moisture immediately.",
  },
  {
    icon: Microscope,
    kicker: "Standard 02 · Cold Micro-Fermentation",
    title: "Low-Dalton Active Fractionation",
    body: "Enzyme-guided fermentation breaks bulky plant triglycerides into smaller bio-available peptides and lipid chains without thermal scorching or solvent residues.",
  },
  {
    icon: ShieldCheck,
    kicker: "Standard 03 · Acid Mantle Buffering",
    title: "Tight pH 5.2–5.6 Calibration",
    body: "All leave-on serums and amino-acid cleansers remain buffered inside your healthy skin mantle range to protect resident microbiome diversity.",
  },
];

const CLINICAL_BENCHMARKS = [
  {
    metric: "Transepidermal water loss reduction",
    value: "96%",
    percent: 96,
    cohort: "28-day Tewameter study · Twice-daily use of Ceramide Barrier Serum & Rosehip Cream",
  },
  {
    metric: "Visible surface smoothness gain",
    value: "94%",
    percent: 94,
    cohort: "Instrumental 3D optical fringe projection across cheek micro-relief zones",
  },
  {
    metric: "Sensitive skin panel tolerance",
    value: "100%",
    percent: 100,
    cohort: "48-hour occluded patch validation across reactive & post-sensitized panels (n=60)",
  },
];

const EXCLUDED_SUBSTANCES = [
  "Synthetic & masking fragrance",
  "Drying denatured alcohols",
  "Sulfates (SLS / SLES)",
  "Volatile essential-oil allergens",
  "Heavy occlusive silicones",
  "Parabens & formaldehyde donors",
];

export const Route = createFileRoute("/our-science")({
  head: () => ({
    meta: [
      { title: "Our Science — ZORVELLAE" },
      { name: "description", content: "Discover the clinical trial data, biomimetic lipid ratios, and cold-fermentation science behind ZORVELLAE." },
      { property: "og:title", content: "Our Science — ZORVELLAE" },
      { property: "og:description", content: "Botanical integrity and measured clinical efficacy at ZORVELLAE." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(publishedPageContentQueryOptions("our-science")),
  component: OurSciencePage,
});

function OurSciencePage() {
  const { data: content } = useSuspenseQuery(publishedPageContentQueryOptions("our-science"));

  return (
    <Storefront>
      <section className="catalog-banner">
        <PageHeading
          eyebrow="Botanical Purity · Clinical Efficacy"
          title={
            content?.title ? (
              content.title
            ) : (
              <>
                Formulation precision rooted in <em>skin biology.</em>
              </>
            )
          }
          description={
            content?.body ??
            "Every ZORVELLAE treatment begins at the cellular junction—calibrating pH, lipid stoichiometry, and ferment particle size before clinical patch testing."
          }
          imageSrc="/site-assets/generated/editorial_our_science_1795670127021.jpg"
          imageAlt="Formulator calibrating botanical extracts and amber glass flasks in the ZORVELLAE studio laboratory"
        />
      </section>

      <section className="science-standards-section">
        <div className="routine-principles-inner">
          <div className="section-heading section-heading-split">
            <div>
              <span className="section-kicker">Laboratory Doctrine</span>
              <h2>Three non-negotiable engineering benchmarks.</h2>
            </div>
            <Link className="text-link" to="/ingredients">
              Read ingredient monographs <ArrowRight size={13} aria-hidden="true" />
            </Link>
          </div>

          <div className="home-standards-grid routine-principles-grid">
            {LAB_STANDARDS.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title}>
                  <span className="home-standard-mark" aria-hidden="true">
                    <Icon />
                  </span>
                  <span className="section-kicker">{item.kicker}</span>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="editorial-section science-trial-section">
        <div className="editorial-home-panel science-trial-panel">
          <div className="editorial-home-image">
            <ResponsiveStoreImage
              src="/site-assets/generated/editorial_ingredients_macro_1795670127823.jpg"
              alt="Macro study of cold-pressed botanical lipids, centella leaves, and colloidal oat extracts"
              sizes="(max-width: 900px) 92vw, 44vw"
            />
          </div>
          <div className="editorial-home-copy">
            <span className="section-kicker">Instrumental Evaluation · 2026</span>
            <h2>
              Measured barrier recovery, <em>never inflated claims.</em>
            </h2>
            <p>
              Instead of relying on subjective consumer surveys alone, ZORVELLAE evaluates active thresholds through transepidermal water loss (TEWL), corneometry, and cross-polarized surface imaging.
            </p>
            <div className="home-metrics-list science-metrics-stack">
              {CLINICAL_BENCHMARKS.map((entry) => (
                <div className="home-metric-row" key={entry.metric}>
                  <div className="home-metric-head">
                    <span className="home-metric-label">{entry.metric}</span>
                    <strong className="home-metric-value">{entry.value}</strong>
                  </div>
                  <div className="home-metric-bar" aria-hidden="true">
                    <span style={{ width: `${entry.percent}%` }} />
                  </div>
                  <p className="home-metric-note">{entry.cohort}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="science-exclusion-section">
        <div className="routine-principles-inner">
          <div className="science-exclusion-card">
            <div className="science-exclusion-copy">
              <span className="section-kicker">Formulation Hygiene · Zero Irritant Policy</span>
              <h2>What we intentionally leave out matters just as much.</h2>
              <p>
                Long-term skin radiance collapses under chronic low-grade inflammation. Every formulation undergoes strict exclusion screening prior to stability validation.
              </p>
              <Link className="store-link" to="/shop">
                Explore clean formulations
              </Link>
            </div>
            <ul className="science-exclusion-list">
              {EXCLUDED_SUBSTANCES.map((substance) => (
                <li key={substance}>
                  <Check size={14} aria-hidden="true" />
                  <span>{substance}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </Storefront>
  );
}