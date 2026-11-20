import { createFileRoute } from "@tanstack/react-router";

import { PageHeading, Storefront } from "@/components/storefront";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [
    { title: "About ZORVELLAE — Botanical Science & Skin Ritual" },
    { name: "description", content: "Learn about ZORVELLAE’s thoughtful, science-led approach to botanical skincare." },
    { property: "og:title", content: "About ZORVELLAE" },
    { property: "og:description", content: "A considered approach to botanical skincare and everyday care." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: AboutPage,
});

function AboutPage() {
  return <Storefront><section className="catalog-banner"><PageHeading eyebrow="Our story" title="Where botanical purity meets clinical efficacy." description="A skincare house built around thoughtful formulation, botanical integrity and the everyday ritual of balanced skin." /></section><section className="simple-page-content"><div className="editorial-home-panel"><div className="editorial-home-image"><img src="/site-assets/zorvellae-hero.webp" alt="Soft botanical leaves against a pale warm ground." /></div><div className="editorial-home-copy"><span className="section-kicker">Our guiding principle</span><h2>Consider every ingredient. Honour the skin.</h2><p>We believe skincare deserves both clarity and care. ZORVELLAE brings a botanical point of view to everyday rituals, with a focus on thoughtful formulations and responsible, measured communication.</p></div></div></section></Storefront>;
}