import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { PageHeading, ProductGrid, Storefront } from "@/components/storefront";
import { catalogQueryOptions, categoriesQueryOptions } from "@/lib/store-data";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Shop Formulations — ZORVELLAE" },
      { name: "description", content: "Explore published ZORVELLAE skincare formulations, organized with care by ritual step and category." },
      { property: "og:title", content: "Shop Formulations — ZORVELLAE" },
      { property: "og:description", content: "Explore clinical botanical skincare formulations from ZORVELLAE." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: async ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(catalogQueryOptions(undefined, false)),
      context.queryClient.ensureQueryData(categoriesQueryOptions),
    ]),
  component: ShopPage,
});

function ShopPage() {
  const [includeDemo, setIncludeDemo] = useState(false);
  const { data: liveProducts } = useSuspenseQuery(catalogQueryOptions(undefined, false));
  const { data: allProducts } = useSuspenseQuery(catalogQueryOptions(undefined, true));
  const { data: categories } = useSuspenseQuery(categoriesQueryOptions);

  const products = includeDemo ? allProducts : liveProducts;
  const hasDemoItems = useMemo(() => allProducts.some((item) => item.is_demo), [allProducts]);

  return (
    <Storefront>
      <section className="catalog-banner">
        <PageHeading
          eyebrow="Botanical Intelligence · Clinical Intention"
          title={
            <>
              Thoughtful care, at <em>every step.</em>
            </>
          }
          description="Explore dermatologically tested, fragrance-free formulations crafted around biomimetic ceramides, signal bio-peptides, and fermented plant lipids."
          imageSrc="/site-assets/generated/editorial_about_atelier_1795670128506.jpg"
          imageAlt="Sunlit ZORVELLAE atelier shelves featuring amber apothecary vessels"
        />
      </section>
      <section className="catalog-body store-products">
        <div className="shop-filter-toolbar">
          <div className="category-filter-list">
            <Link className="category-chip" aria-current="page" to="/shop">
              All formulations ({products.length})
            </Link>
            {categories.map((category) => (
              <Link className="category-chip" key={category.id} to="/shop/category/$slug" params={{ slug: category.slug }}>
                {category.name}
              </Link>
            ))}
          </div>
          {hasDemoItems && (
            <label className="shop-demo-toggle">
              <input type="checkbox" checked={includeDemo} onChange={(event) => setIncludeDemo(event.target.checked)} />
              <span>Include studio sample previews</span>
            </label>
          )}
        </div>
        <div className="section-ruler" />
        {includeDemo && products.some((product) => product.is_demo) && (
          <p className="featured-note" role="note">
            Items marked as studio samples are illustrative previews and cannot be added to your bag.
          </p>
        )}
        <ProductGrid products={products} />
      </section>
    </Storefront>
  );
}