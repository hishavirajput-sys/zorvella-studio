import { useEffect } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, Droplet, FlaskConical, Leaf, Sparkles } from "lucide-react";
import { useSuspenseQuery } from "@tanstack/react-query";

import { ProductGrid, Storefront, type } from "@/components/storefront";
import { catalogQueryOptions } from "@/lib/store-data";

const values = [
  { label: "Science-led", detail: "Thoughtful formulation", icon: FlaskConical },
  { label: "Botanical integrity", detail: "Respectful sourcing", icon: Leaf },
  { label: "Barrier-minded", detail: "Care for skin at its core", icon: Droplet },
  { label: "Daily ritual", detail: "Care made considered", icon: Sparkles },
];

const steps = [
  { number: "01", title: "Cleanse", copy: "Begin with a gentle, considered cleanse.", image: "/site-assets/home/step-cleanse.webp", imageAlt: "Illustrative botanical cleansing ingredients." },
  { number: "02", title: "Treat", copy: "Choose a focused serum for your skin ritual.", image: "/site-assets/home/step-treat.webp", imageAlt: "Illustrative skincare texture; not a ZORVELLAE product." },
  { number: "03", title: "Hydrate", copy: "Bring thoughtful hydration into your ritual.", image: "/site-assets/home/step-hydrate.webp", imageAlt: "Illustrative cosmetic preparation, not a ZORVELLAE facility." },
  { number: "04", title: "Protect", copy: "Finish with daily care for the skin barrier.", image: "/site-assets/home/step-protect.webp", imageAlt: "Illustrative skincare ritual photography." },
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ZORVELLAE — Botanical Skincare, Considered" },
      { name: "description", content: "Discover ZORVELLAE: a science-led, botanical approach to thoughtfully formulated skincare and balanced daily rituals." },
      { property: "og:title", content: "ZORVELLAE — Botanical Skincare, Considered" },
      { property: "og:description", content: "Botanical intelligence. Clinical intention. Discover thoughtfully considered skincare rituals from ZORVELLAE." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogQueryOptions()),
  component: HomePage,
});

function HomePage() {
  const { data: products } = useSuspenseQuery(catalogQueryOptions());
  const router = useRouter();

  useEffect(() => {
    const { data } = (async () => ({ data: await import("@/integrations/supabase/client") }))();
    void data.then(({ supabase }) => {
      const { data: subscription } = supabase.auth.onAuthStateChange((event) => {
        if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
        router.invalidate();
        if (event !== "SIGNED_OUT") void router.options.context.queryClient.invalidateQueries();
      });
      return subscription.subscription.unsubscribe;
    });
  }, [router]);

  return (
    <Storefront>
      <section className="home-intro">
        <div className="home-copy">
          <span className="eyebrow">Botanical science · thoughtful ritual</span>
          <h1 className="home-title">Where Botanical Purity Meets <em>Clinical Efficacy.</em></h1>
          <p className="home-summary">Formulations that unite restorative botanicals with clinically considered actives—created for resilient, balanced skin.</p>
          <div className="home-cta-row">
            <Link className="store-link" to="/shop">Discover the collection <ArrowRight size={14} /></Link>
            <Link className="store-link store-link-outline" to="/routines">Find your ritual</Link>
          </div>
        </div>
        <div className="hero-photo"><img src="/site-assets/zorvellae-hero.webp" alt="Pale botanical leaves in soft light, from the original ZORVELLAE editorial photograph." /></div>
      </section>
      <section className="value-strips" aria-label="Our principles">
        {values.map(({ label, detail, icon: Icon }) => <div className="value-strip" key={label}><span className="value-icon"><Icon aria-hidden="true" /></span><p><strong>{label}</strong>{detail}</p></div>)}
      </section>
      <section className="step-section">
        <div className="section-heading"><div><span className="section-kicker">Your skin, thoughtfully considered</span><h2>Shop by formulation step</h2></div><Link to="/shop" className="text-link">View all <ArrowRight size={14} /></Link></div>
        <div className="step-grid">{steps.map((step) => <Link className="step-card" key={step.number} to="/shop"><span className="step-image"><img src={step.image} alt={step.imageAlt} loading="lazy" /><span className="step-index">Step {step.number}</span></span><span className="step-copy"><strong>{step.title}</strong><span>{step.copy}</span><span className="step-link">Explore <ArrowRight size={12} /></span></span></Link>)}</div>
      </section>
      <section className="featured-section">
        <div className="section-heading"><div><span className="section-kicker">Curated essentials</span><h2>Thoughtful formulations</h2></div><Link to="/shop" className="text-link">Browse collection <ArrowRight size={14} /></Link></div>
        {products.length === 0 ? <p className="featured-note">Our shop catalogue is being prepared. No sample or unapproved product listings are offered for sale.</p> : <p className="featured-note"><BadgeCheck size={14} /> Published formulations</p>}
        <div style={{ paddingTop: "22px" }}><ProductGrid products={products.slice(0, 4)} onQuickAdd={false} /></div>
      </section>
      <section className="editorial-section">
        <div className="editorial-home-panel"><div className="editorial-home-image"><img src="/site-assets/home/science-editorial.webp" alt="Illustrative laboratory glassware and skincare preparation; not a ZORVELLAE facility or study." loading="lazy" /></div><div className="editorial-home-copy"><span className="section-kicker">Our philosophy</span><h2>Formulated with reverence for the skin barrier.</h2><p>Botanical knowledge and scientific rigour, working in concert. Thoughtful formulations that honour the skin’s natural balance, built around the ritual of everyday care.</p><Link to="/our-science" className="text-link">Explore our approach <ArrowRight size={14} /></Link></div></div>
      </section>
      <section className="ritual-band"><span className="eyebrow">A ritual that is your own</span><h2>A little clarity goes a long way.</h2><p>Discover the rhythms, routines and ingredients that are a considered fit for your skin.</p><Link to="/routines" className="store-link">Explore your skin ritual <ArrowRight size={14} /></Link></section>
      <section className="faq-section"><div className="section-heading"><div><span className="section-kicker">A considered approach</span><h2>Frequently considered</h2></div></div><div className="faq-list"><details><summary>What does a science-led botanical approach mean? <span aria-hidden="true">+</span></summary><p>It means looking at each ingredient for its purpose and suitability, then thoughtfully pairing botanical materials with clinically considered actives.</p></details><details><summary>How can I find a ritual that suits me? <span aria-hidden="true">+</span></summary><p>Explore the routine guide to understand the cleanse, treat, hydrate and protect steps; start with one considered addition at a time.</p></details><details><summary>Are every ingredient and use instruction published? <span aria-hidden="true">+</span></summary><p>Product-specific ingredient and use details are shown with approved published formulations only. No ingredient claims are invented for demonstration.</p></details><details><summary>Is product photography coming soon? <span aria-hidden="true">+</span></summary><p>Authentic product images and approved descriptions will appear once complete store details are provided.</p></details></div></section>
    </Storefront>
  );
}