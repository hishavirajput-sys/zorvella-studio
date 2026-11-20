import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { PageHeading, ProductGrid, Storefront } from "@/components/storefront";
import { catalogQueryOptions, wishlistQueryOptions } from "@/lib/store-data";

export const Route = createFileRoute("/wishlist")({
  head: () => ({ meta: [
    { title: "Saved Formulations — ZORVELLAE" },
    { name: "description", content: "A list of the ZORVELLAE formulations you saved." },
    { property: "og:title", content: "Saved Formulations — ZORVELLAE" },
    { property: "og:description", content: "Your saved ZORVELLAE formulations." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  loader: ({ context }) => Promise.all([
    context.queryClient.ensureQueryData(wishlistQueryOptions),
    context.queryClient.ensureQueryData(catalogQueryOptions()),
  ]),
  component: WishlistPage,
});

function WishlistPage() {
  const { data: ids } = useSuspenseQuery(wishlistQueryOptions);
  const { data: products } = useSuspenseQuery(catalogQueryOptions());
  return <Storefront><section className="catalog-banner"><PageHeading eyebrow="Your thoughtfully curated shelf" title="Saved formulations" description="The published formulations you have saved for later." /></section><section className="catalog-body"><ProductGrid products={ids ? products.filter((product) => ids.includes(product.id)) : []} onQuickAdd={false} /></section></Storefront>;
}