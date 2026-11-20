import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { PageHeading, Storefront } from "@/components/storefront";

export const Route = createFileRoute("/routines")({
  head: () => ({ meta: [
    { title: "Skincare Rituals — ZORVELLAE" },
    { name: "description", content: "Explore a balanced four-step skincare ritual: cleanse, treat, hydrate and protect." },
    { property: "og:title", content: "Skincare Rituals — ZORVELLAE" },
    { property: "og:description", content: "A thoughtful cleanse, treat, hydrate and protect ritual from ZORVELLAE." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: RoutinesPage,
});

const rituals = [
  { n: "01", title: "Cleanse", time: "Morning · Evening", text: "Start with a gentle cleanse suited to your skin and the day ahead.", to: "/shop" },
  { n: "02", title: "Treat", time: "Choose a focused formula", text: "Consider a targeted published formulation when you are ready.", to: "/shop" },
  { n: "03", title: "Hydrate", time: "Comfort and balance", text: "Build a moisturising step into your own daily rhythm.", to: "/shop" },
  { n: "04", title: "Protect", time: "Daily care", text: "Finish with an appropriate daily barrier care step.", to: "/shop" },
];

function RoutinesPage() {
  return <Storefront><section className="catalog-banner"><PageHeading eyebrow="Skin ritual, made simple" title={<>Your skin. Your ritual.</>} description="A considered framework for everyday care: start with the basics and choose steps that suit your skin." /></section><section className="routine-section"><div className="section-heading"><div><span className="section-kicker">Thoughtful, everyday care</span><h2>Four simple steps.</h2></div></div><div className="routine-grid">{rituals.map((ritual) => <Link className="routine-card" to={ritual.to} key={ritual.n}><span className="eyebrow">Step {ritual.n} · {ritual.time}</span><strong className="editorial-title">{ritual.title}</strong><span>{ritual.text}<ArrowRight size={11} /></span></Link>)}</div><p className="account-lead routine-disclaimer">This general information is not personalised advice. Follow product-specific directions for any approved formulation.</p></section></Storefront>;
}