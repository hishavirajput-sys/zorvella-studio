import { createFileRoute, Link } from "@tanstack/react-router";

import { PageHeading, Storefront, useStoreCart } from "@/components/storefront";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [
    { title: "Checkout — ZORVELLAE" },
    { name: "description", content: "Review your saved ZORVELLAE formulations before checkout becomes available." },
    { property: "og:title", content: "Checkout — ZORVELLAE" },
    { property: "og:description", content: "ZORVELLAE checkout information." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { items } = useStoreCart();
  return <Storefront><section className="page-content"><PageHeading eyebrow="A deliberate next step" title="Your checkout." description={`${items.reduce((count, item) => count + item.quantity, 0)} items in your bag.`} /><div className="checkout-placeholder"><span className="eyebrow">Preparing thoughtfully</span><p>Checkout is not active yet. The original store has no payment service, delivery rates, or tax calculations, and sample products are not available to buy. We will not collect card or shipping details until those services are configured.</p><Link className="store-link" to="/cart">Return to your bag</Link></div></section></Storefront>;
}