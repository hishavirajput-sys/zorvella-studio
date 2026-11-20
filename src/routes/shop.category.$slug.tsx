import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { PageHeading, ProductGrid, Storefront } from "@/components/storefront";
import { catalogQueryOptions, categoriesQueryOptions } from "@/lib/store-data";

export const Route = createFileRoute("/shop/category/$slug")({
  head: ({ params }) => ({ meta: [
    { title: `${params.slug.replaceAll("-", " ")} — ZORVELLAE Formulations` },
    { name: "description", content: `Explore thoughtfully considered ${params.slug.replaceAll("-", " ")} skincare formulations from ZORVELLAE.` },
    { property: "og:title", content: `${params.slug.replaceAll("-", " ")} — ZORVELLAE Formulations` },
    { property: "og:description", content: `Explore published ZORVELLAE ${params.slug.replaceAll("-", " ")} skincare formulations.` },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  loader: async ({ context, params }) => Promise.all([
    context.queryClient.ensureQueryData(catalogQueryOptions(params.slug)),
    context.queryClient.ensureQueryData(categoriesQueryOptions),
  ]),
  component: CategoryPage,
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const { data: products } = useSuspenseQuery(catalogQueryOptions(slug));
  const { data: categories } = useSuspenseQuery(categoriesQueryOptions);
  const category = categories.find((item) => item.slug === slug);
  return (
    <Storefront>
      <section className="catalog-banner"><PageHeading eyebrow="Shop by formulation" title={category?.name ?? "Botanical formulations"} description={category?.description || "A considered collection of published formulations, chosen to sit thoughtfully within your ritual."} /></section>
      <section className="catalog-body store-products">
        <div className="category-filter-list"><Link className="category-chip" to="/shop">All formulations</Link>{categories.map((item) => <Link className="category-chip" aria-current={item.slug === slug ? "page" : undefined} key={item.id} to="/shop/category/$slug" params={{ slug: item.slug }}>{item.name}</Link>)}</div>
        <div className="section-ruler" />
        <ProductGrid products={products} />
      </section>
    </Storefront>
  );
}