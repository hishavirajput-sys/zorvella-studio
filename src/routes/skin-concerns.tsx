import { createFileRoute } from "@tanstack/react-router";

import { PageHeading, Storefront } from "@/components/storefront";

const concerns = ["Barrier support", "Dryness", "Uneven-looking tone", "Dullness", "Texture", "Visible fine lines", "Sensitive-feeling skin", "Oil balance", "Daily hydration", "Environmental stress"];

export const Route = createFileRoute("/skin-concerns")({
  head: () => ({ meta: [
    { title: "Skin Concerns — ZORVELLAE" },
    { name: "description", content: "Explore an informational index of common skin-care topics and categories." },
    { property: "og:title", content: "Skin Concerns — ZORVELLAE" },
    { property: "og:description", content: "General skincare topics, presented with care by ZORVELLAE." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: SkinConcernsPage,
});

function SkinConcernsPage() {
  return <Storefront><section className="catalog-banner"><PageHeading eyebrow="Skin, in its many rhythms" title="Get to know your skin." description="An informational guide to common skincare topics. Individual skin experiences differ; for personal concerns, seek advice from a qualified clinician." /></section><section className="simple-page-content"><div className="concern-grid">{concerns.map((concern) => <div className="concern-item" key={concern}>{concern}<span>↗</span></div>)}</div><p className="account-lead concern-note">This is a general educational overview—not a medical assessment. This store’s development product samples cannot be bought or used as treatment recommendations.</p></section></Storefront>;
}