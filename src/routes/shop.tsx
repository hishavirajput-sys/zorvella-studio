import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { PageHeading, ProductGrid, Storefront } from "@/components/storefront";
import { catalogQueryOptions, categoriesQueryOptions } from "@/lib/store-data";

export const Route = createFileRoute("/shop")({
  head: () => ({ meta: [
    { title: "Shop Formulations — ZORVELLAE" },
    { name: "description", content: "Explore published ZORVELLAE skincare formulations, organized with care by ritual step and category." },
    { property: "og:title", content: "Shop Formulations — ZORVELLAE" },
    { property: "og:description", content: "Explore considered skincare formulations from ZORVELLAE." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  loader: async ({ context }) => Promise.all([
    context.queryClient.ensureQueryData(catalogQueryOptions()),
    context.queryClient.ensureQueryData(categoriesQueryOptions),
  ]),
  component: ShopPage,
});

function ShopPage() {
  const { data: products } = useSuspenseQuery(catalogQueryOptions());
  const { data: categories } = useSuspenseQuery(categoriesQueryOptions);
  return (
    <Storefront>
      <section className="catalog-banner"><PageHeading eyebrow="Botanical intelligence · clinical intention" title={<>Thoughtful care, at every step.</>} description="Find a considered approach to cleanse, treat, hydrate and protect. Only approved, published formulations appear here." /></section>
      <section className="catalog-body store-products">
        <div className="category-filter-list"><Link className="category-chip" aria-current="page" to="/shop">All formulations</Link>{categories.map((category) => <Link className="category-chip" key={category.id} to="/shop/category/$slug" params={{ slug: category.slug }}>{category.name}</Link>)}</div>
        <div className="section-ruler" />
        <ProductGrid products={products} />
      </section>
    </Storefront>
  );
}