import { createFileRoute } from "@tanstack/react-router";

import { PageHeading, Storefront } from "@/components/storefront";

export const Route = createFileRoute("/our-science")({
  head: () => ({ meta: [
    { title: "Our Science — ZORVELLAE" },
    { name: "description", content: "Discover the considered, science-led approach behind ZORVELLAE botanical skincare." },
    { property: "og:title", content: "Our Science — ZORVELLAE" },
    { property: "og:description", content: "Botanical integrity and a considered science-led approach at ZORVELLAE." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: OurSciencePage,
});

function OurSciencePage() {
  return <Storefront><section className="catalog-banner"><PageHeading eyebrow="Botanical purity · clinical efficacy" title="Science is at the heart of better skincare." description="Thoughtful formulation begins with clarity: careful material choices, purposeful design and an honest account of what is known." /></section><section className="article-section"><div className="editorial-home-panel"><div className="editorial-home-image"><img src="/site-assets/home/science-editorial.webp" alt="Illustrative skincare laboratory scene; it does not depict the brand's premises." /></div><div className="editorial-home-copy"><span className="section-kicker">A considered foundation</span><h2>Botanical knowledge. Clinical rigour.</h2><p>ZORVELLAE is designed around considered skincare and respect for the skin barrier. Product-level ingredient details, usage and evidence are shown only with their approved published formulations.</p></div></div></section></Storefront>;
}