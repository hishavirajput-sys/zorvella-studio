import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, Leaf, ShieldCheck, Sparkles } from "lucide-react";

import { ResponsiveStoreImage } from "@/components/responsive-image";
import { PageHeading, Storefront } from "@/components/storefront";
import { publishedPageContentQueryOptions } from "@/lib/page-content";

const HOUSE_PILLARS = [
  {
    icon: Leaf,
    kicker: "01 · Traceable Sourcing",
    title: "Wild-Harvested & Fermented Origins",
    body: "From Swiss Alpine edelweiss to sugarcane-fermented squalane, every botanical active carries batch-level harvest documentation before entering a vessel.",
  },
  {
    icon: ShieldCheck,
    kicker: "02 · Quiet Minimalism",
    title: "Fewer Steps. Deeper Recovery.",
    body: "We build multi-tasking lamellar formulas so four thoughtful daily steps replace twelve conflicting acids and overcrowded shelves.",
  },
  {
    icon: Sparkles,
    kicker: "03 · Apothecary Tactility",
    title: "Recyclable UV-Protected Glass",
    body: "Opaque frosted glass and heavyweight amber jars preserve peptide stability naturally without single-use foil blister coatings.",
  },
];

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About ZORVELLAE — Botanical Science & Skin Ritual" },
      { name: "description", content: "Learn about ZORVELLAE’s atelier philosophy, traceable ingredient standards, and clinical skincare craftsmanship." },
      { property: "og:title", content: "About ZORVELLAE" },
      { property: "og:description", content: "A considered house of botanical clinical skincare." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(publishedPageContentQueryOptions("about-us")),
  component: AboutPage,
});

function AboutPage() {
  const { data: content } = useSuspenseQuery(publishedPageContentQueryOptions("about-us"));

  return (
    <Storefront>
      <section className="catalog-banner">
        <PageHeading
          eyebrow="Our Story & Atelier"
          title={
            content?.title ? (
              content.title
            ) : (
              <>
                Where botanical purity meets <em>clinical efficacy.</em>
              </>
            )
          }
          description={
            content?.body ??
            "ZORVELLAE was founded on a quiet conviction: modern skin recovery thrives on biomimetic restraint, transparent chemistry, and unhurried daily ritual."
          }
          imageSrc="/site-assets/generated/editorial_about_atelier_1795670128506.jpg"
          imageAlt="Sunlit minimalist ZORVELLAE flagship atelier with travertine shelving and amber glass bottles"
        />
      </section>

      <section className="article-section">
        <div className="editorial-home-panel">
          <div className="editorial-home-image">
            <ResponsiveStoreImage
              src="/site-assets/home/science-editorial.webp"
              alt="ZORVELLAE ceramic formulation tray and clinical pipettes in daylight"
              sizes="(max-width: 900px) 92vw, 44vw"
            />
          </div>
          <div className="editorial-home-copy">
            <span className="section-kicker">Our Guiding Principle</span>
            <h2>Consider every ingredient. Honour the living barrier.</h2>
            <p>
              Too much contemporary skincare trades long-term barrier resilience for short-term stinging brightness. ZORVELLAE unites bio-identical lipids, buffered niacinamide, and soothing alpine ferments in disciplined formulas built for years—not fleeting trends.
            </p>
            <div className="home-cta-row">
              <Link className="store-link" to="/our-science">
                Explore our science
              </Link>
              <Link className="store-link store-link-outline" to="/shop">
                View formulations
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="routine-principles-section">
        <div className="routine-principles-inner">
          <div className="home-centered-heading">
            <span className="section-kicker">House Standards</span>
            <h2>Crafted between dermatology &amp; nature.</h2>
          </div>
          <div className="home-standards-grid routine-principles-grid">
            {HOUSE_PILLARS.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <article key={pillar.title}>
                  <span className="home-standard-mark" aria-hidden="true">
                    <Icon />
                  </span>
                  <span className="section-kicker">{pillar.kicker}</span>
                  <h3>{pillar.title}</h3>
                  <p>{pillar.body}</p>
                </article>
              );
            })}
          </div>

          <div className="home-diagnostic-banner concern-cta-band">
            <div className="home-diagnostic-copy">
              <span className="section-kicker">Atelier Consultations</span>
              <h2>Questions on routines, formulation stability, or stockists?</h2>
              <p>Write to our skincare concierges directly and receive tailored, unhurried guidance.</p>
              <div className="home-diagnostic-actions">
                <Link className="store-link" to="/contact">
                  Contact our atelier
                </Link>
                <Link className="store-link store-link-outline" to="/routines">
                  Explore AM/PM rituals <ArrowRight size={13} aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Storefront>
  );
}