import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { PageHeading, ProductGrid, Storefront } from "@/components/storefront";
import { catalogQueryOptions, wishlistQueryOptions } from "@/lib/store-data";

export const Route = createFileRoute("/wishlist")({
  head: () => ({
    meta: [
      { title: "Saved Formulations — ZORVELLAE" },
      { name: "description", content: "A curated shelf of ZORVELLAE formulations saved to your profile." },
      { property: "og:title", content: "Saved Formulations — ZORVELLAE" },
      { property: "og:description", content: "Your saved ZORVELLAE formulations." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(wishlistQueryOptions),
      context.queryClient.ensureQueryData(catalogQueryOptions()),
    ]),
  component: WishlistPage,
});

function WishlistPage() {
  const { data: ids } = useSuspenseQuery(wishlistQueryOptions);
  const { data: products } = useSuspenseQuery(catalogQueryOptions());
  const savedProducts = ids ? products.filter((product) => ids.includes(product.id)) : [];

  return (
    <Storefront>
      <section className="catalog-banner">
        <PageHeading
          eyebrow="Your Thoughtfully Curated Shelf"
          title={
            <>
              Saved <em>formulations.</em>
            </>
          }
          description="Keep preferred daily serums, cleansers, and restorative barrier treatments close at hand for seasonal reordering."
          imageSrc="/site-assets/generated/product_radiance_elixir_1795670125654.jpg"
          imageAlt="Frosted ZORVELLAE radiance serum dropper resting on stone beside alpine botanicals"
        />
      </section>
      <section className="catalog-body">
        <ProductGrid products={savedProducts} onQuickAdd />
      </section>
    </Storefront>
  );
}