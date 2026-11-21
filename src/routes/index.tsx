import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowDownRight, ArrowRight, BadgeCheck, Droplet, FlaskConical, Leaf, Sparkles } from "lucide-react";

import serumImage from "@/assets/zorvellae-serum-editorial.png.asset.json";
import { ProductGrid, Storefront } from "@/components/storefront";
import { catalogQueryOptions } from "@/lib/store-data";

const values = [
  { title: "Science-led", detail: "Thoughtful formulation", icon: FlaskConical },
  { title: "Botanical integrity", detail: "Respectful sourcing", icon: Leaf },
  { title: "Barrier-minded", detail: "Care for skin at its core", icon: Droplet },
  { title: "Daily ritual", detail: "Care made considered", icon: Sparkles },
];

const steps = [
  { number: "01", title: "Cleanse", copy: "Begin with a gentle, considered cleanse.", image: "/site-assets/home/step-cleanse.webp", imageAlt: "Illustrative botanical cleansing ingredients." },
  { number: "02", title: "Treat", copy: "Choose a focused serum for your skin ritual.", image: "/site-assets/home/step-treat.webp", imageAlt: "Illustrative skincare texture; not a ZORVELLAE product." },
  { number: "03", title: "Hydrate", copy: "Bring thoughtful hydration into your ritual.", image: "/site-assets/home/step-hydrate.webp", imageAlt: "Illustrative cosmetic preparation, not a ZORVELLAE facility." },
  { number: "04", title: "Protect", copy: "Finish with daily care for the skin barrier.", image: "/site-assets/home/step-protect.webp", imageAlt: "Illustrative skincare ritual photography." },
];

const principles = [
  { title: "Start with purpose", copy: "Every ingredient has a reason to be there.", image: "/site-assets/home/step-hydrate.webp", alt: "Illustrative skincare preparation." },
  { title: "Respect the skin barrier", copy: "A considered approach begins with skin’s natural balance.", image: "/site-assets/home/science-editorial.webp", alt: "Illustrative laboratory glassware; not a ZORVELLAE facility." },
  { title: "Share what is known", copy: "Product details belong with approved, published formulations.", image: "/site-assets/home/step-treat.webp", alt: "Illustrative skincare texture." },
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

  return (
    <Storefront>
      <section className="home-intro home-reference-hero">
        <div className="home-copy">
          <span className="eyebrow">Botanical science · thoughtful ritual</span>
          <h1 className="home-title">Where Botanical Purity Meets <em>Clinical Efficacy.</em></h1>
          <p className="home-summary">Formulations that unite restorative botanicals with clinically considered actives—created for resilient, balanced skin.</p>
          <div className="home-cta-row">
            <Link className="store-link" to="/shop">Discover the collection <ArrowRight size={14} /></Link>
            <Link className="store-link store-link-outline" to="/routines">Explore your ritual</Link>
          </div>
          <div className="hero-note"><BadgeCheck aria-hidden="true" size={16} /><span>Thoughtful care, shared with clarity.</span></div>
        </div>
        <div className="hero-photo hero-product-photo">
          <img src={serumImage.url} alt="ZORVELLAE Renew & Repair Treatment Elixir and Luminous Elixir bottles on a stone slab." />
          <span className="hero-photo-caption">Botanical intelligence · clinical intention</span>
        </div>
      </section>

      <section className="value-strips" aria-label="Our principles">
        {values.map(({ title, detail, icon: Icon }) => (
          <div className="value-strip" key={title}>
            <span className="value-icon"><Icon aria-hidden="true" /></span>
            <p><strong>{title}</strong>{detail}</p>
          </div>
        ))}
      </section>

      <section className="step-section home-step-section">
        <div className="section-heading">
          <div><span className="section-kicker">Your skin, thoughtfully considered</span><h2>Shop by Formulation Step</h2></div>
          <Link to="/routines" className="text-link">Explore the ritual <ArrowRight size={14} /></Link>
        </div>
        <div className="step-grid">
          {steps.map((step) => (
            <Link className="step-card" key={step.number} to="/routines">
              <span className="step-image"><img src={step.image} alt={step.imageAlt} loading="lazy" /><span className="step-index">Step {step.number}</span></span>
              <span className="step-copy"><strong>{step.title}</strong><span>{step.copy}</span><span className="step-link">Explore <ArrowRight size={12} /></span></span>
            </Link>
          ))}
        </div>
      </section>

      <section className="featured-section home-formulations-section">
        <div className="section-heading">
          <div><span className="section-kicker">A considered collection</span><h2>Our Formulations</h2></div>
          <Link to="/shop" className="text-link">View the collection <ArrowRight size={14} /></Link>
        </div>
        {products.length > 0 ? (
          <>
            <p className="featured-note"><BadgeCheck size={14} /> Published formulations</p>
            <div className="home-product-grid"><ProductGrid products={products.slice(0, 4)} onQuickAdd={false} /></div>
          </>
        ) : (
          <div className="home-formulations-empty">
            <span className="eyebrow">The collection is being prepared</span>
            <p>Approved product details will appear here when they are ready. No sample or unapproved listings are offered for sale.</p>
            <Link to="/shop" className="text-link">Visit the shop <ArrowRight size={14} /></Link>
          </div>
        )}
      </section>

      <section className="editorial-section home-science-section">
        <div className="home-science-layout">
          <div className="home-image-mosaic" aria-label="Illustrative skincare and botanical imagery">
            <figure className="mosaic-large"><img src="/site-assets/home/step-hydrate.webp" alt="Illustrative skincare texture." loading="lazy" /></figure>
            <figure><img src="/site-assets/home/step-protect.webp" alt="Illustrative botanical skincare still life." loading="lazy" /></figure>
            <figure><img src="/site-assets/home/science-editorial.webp" alt="Illustrative lab scene; not a ZORVELLAE facility or study." loading="lazy" /></figure>
          </div>
          <div className="home-science-copy">
            <span className="section-kicker">A considered foundation</span>
            <h2>Formulated with Reverence for Skin Biology.</h2>
            <p>Botanical knowledge and scientific rigour, working in concert. Thoughtful formulations that honour the skin’s natural balance and the ritual of everyday care.</p>
            <div className="home-principle-list">
              {principles.map((principle, index) => (
                <details key={principle.title} open={index === 0}>
                  <summary>{principle.title}<span aria-hidden="true">{index === 0 ? "−" : "+"}</span></summary>
                  <p>{principle.copy}</p>
                </details>
              ))}
            </div>
            <Link to="/our-science" className="text-link">Explore our approach <ArrowRight size={14} /></Link>
          </div>
        </div>
      </section>

      <section className="home-ritual-section">
        <div className="home-centered-heading">
          <span className="section-kicker">Considered clinical rituals</span>
          <h2>Care, One Thoughtful Step at a Time.</h2>
          <p>Explore a routine built around the simple steps of cleanse, treat, hydrate and protect.</p>
        </div>
        <div className="home-ritual-feature-grid">
          <article className="home-ritual-feature">
            <div className="home-ritual-image"><img src={serumImage.url} alt="Two ZORVELLAE serum bottles in soft botanical light." loading="lazy" /></div>
            <div className="home-ritual-copy"><span className="section-kicker">Step 02 · Treat</span><h3>Focused care, thoughtfully considered.</h3><p>See approved ingredient and use information alongside each published formulation.</p><Link to="/shop" className="store-link">Explore formulations <ArrowRight size={14} /></Link></div>
          </article>
          <article className="home-ritual-feature home-ritual-feature-reverse">
            <div className="home-ritual-image"><img src="/site-assets/home/science-editorial.webp" alt="Illustrative skincare preparation; not a ZORVELLAE laboratory." loading="lazy" /></div>
            <div className="home-ritual-copy"><span className="section-kicker">Your daily ritual</span><h3>Find a rhythm that feels considered.</h3><p>Discover the four simple steps and explore the ideas behind a thoughtful routine.</p><Link to="/routines" className="store-link">Explore your ritual <ArrowRight size={14} /></Link></div>
          </article>
        </div>
      </section>

      <section className="home-promo-band">
        <div>
          <span className="section-kicker">A ritual that is your own</span>
          <h2>Discover a More Considered Skin Ritual.</h2>
          <p>Explore the rhythms, routines and ingredients that are a considered fit for your skin.</p>
          <div className="home-cta-row"><Link to="/routines" className="store-link">Find your ritual <ArrowRight size={14} /></Link><Link to="/ingredients" className="text-link">Explore ingredients <ArrowRight size={14} /></Link></div>
        </div>
        <ArrowDownRight className="home-promo-mark" aria-hidden="true" />
      </section>

      <section className="home-dispatch-section">
        <div className="section-heading">
          <div><span className="section-kicker">Botanical intelligence · clinical intention</span><h2>Explore the ZORVELLAE Approach</h2></div>
          <Link to="/our-science" className="text-link">Discover more <ArrowRight size={14} /></Link>
        </div>
        <div className="home-dispatch-grid">
          <Link to="/our-science" className="home-dispatch-card"><span className="home-dispatch-image"><img src="/site-assets/home/science-editorial.webp" alt="Illustrative skincare laboratory scene; it does not depict the brand's premises." loading="lazy" /></span><span className="section-kicker">Our approach</span><strong>Botanical knowledge. Clinical rigour.</strong><span className="text-link">Explore our science <ArrowRight size={13} /></span></Link>
          <Link to="/ingredients" className="home-dispatch-card"><span className="home-dispatch-image"><img src="/site-assets/home/step-hydrate.webp" alt="Illustrative botanical skincare ingredients." loading="lazy" /></span><span className="section-kicker">Ingredient library</span><strong>Clarity begins with what is known.</strong><span className="text-link">Explore ingredients <ArrowRight size={13} /></span></Link>
          <Link to="/routines" className="home-dispatch-card"><span className="home-dispatch-image"><img src="/site-assets/home/step-cleanse.webp" alt="Illustrative daily skincare ritual." loading="lazy" /></span><span className="section-kicker">Daily care</span><strong>Build a ritual, one step at a time.</strong><span className="text-link">Explore rituals <ArrowRight size={13} /></span></Link>
        </div>
      </section>

      <section className="faq-section home-faq-section">
        <div className="home-centered-heading"><span className="section-kicker">A considered approach</span><h2>Frequently Considered</h2></div>
        <div className="faq-list">
          <details><summary>What does a science-led botanical approach mean? <span aria-hidden="true">+</span></summary><p>It means looking at each ingredient for its purpose and suitability, then thoughtfully pairing botanical materials with clinically considered actives.</p></details>
          <details><summary>How can I find a ritual that suits me? <span aria-hidden="true">+</span></summary><p>Explore the routine guide to understand the cleanse, treat, hydrate and protect steps; start with one considered addition at a time.</p></details>
          <details><summary>Are every ingredient and use instruction published? <span aria-hidden="true">+</span></summary><p>Product-specific ingredient and use details are shown with approved published formulations only. No ingredient claims are invented for demonstration.</p></details>
          <details><summary>Are the formulations available to purchase? <span aria-hidden="true">+</span></summary><p>The shop will show approved, published formulations when complete product details are available. Unapproved listings are not offered for sale.</p></details>
        </div>
      </section>

      <section className="home-standards-section" aria-label="Our guiding principles">
        <div className="home-standards-grid">
          <article><span className="home-standard-mark"><Leaf aria-hidden="true" /></span><span className="section-kicker">Botanical integrity</span><h3>Respectful sourcing.</h3><p>Care begins with a thoughtful point of view on ingredients.</p></article>
          <article><span className="home-standard-mark"><FlaskConical aria-hidden="true" /></span><span className="section-kicker">Thoughtful formulation</span><h3>Purpose in every step.</h3><p>Product details are shared with care and clarity.</p></article>
          <article><span className="home-standard-mark"><Droplet aria-hidden="true" /></span><span className="section-kicker">Barrier-minded</span><h3>Care for skin at its core.</h3><p>A considered ritual can begin simply, one step at a time.</p></article>
        </div>
      </section>
    </Storefront>
  );
}