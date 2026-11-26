import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, Search } from "lucide-react";

import { PageHeading, Storefront } from "@/components/storefront";
import { supabase } from "@/integrations/supabase/client";
import { catalogQueryOptions } from "@/lib/store-data";

const CATEGORY_GROUPS = [
  { id: "all", label: "All monographs" },
  { id: "lipids", label: "Barrier lipids" },
  { id: "actives", label: "Peptides & vitamin B3" },
  { id: "botanicals", label: "Calming ferments" },
];

function classifyMonograph(slug: string, name: string, inci: string | null) {
  const haystack = `${slug} ${name} ${inci ?? ""}`.toLowerCase();
  if (haystack.includes("ceramide") || haystack.includes("squalane") || haystack.includes("rosehip")) return "lipids";
  if (haystack.includes("peptide") || haystack.includes("niacinamide")) return "actives";
  return "botanicals";
}

export const Route = createFileRoute("/ingredients")({
  head: () => ({
    meta: [
      { title: "Ingredient Library — ZORVELLAE" },
      { name: "description", content: "Explore published ingredient monographs, INCI classifications, and formulation science behind ZORVELLAE." },
      { property: "og:title", content: "Ingredient Library — ZORVELLAE" },
      { property: "og:description", content: "Explore ZORVELLAE botanical and clinical ingredient monographs." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: async ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData({
        queryKey: ["store", "ingredients"],
        queryFn: async () => {
          const { data, error } = await supabase
            .from("ingredients")
            .select("id, name, inci, slug, summary, monograph, sort_order")
            .eq("status", "published")
            .order("sort_order")
            .order("name");
          if (error) throw error;
          return data;
        },
      }),
      context.queryClient.ensureQueryData(catalogQueryOptions(undefined, false)),
    ]),
  component: IngredientLibrary,
});

function IngredientLibrary() {
  const { data: ingredients } = useSuspenseQuery({
    queryKey: ["store", "ingredients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ingredients")
        .select("id, name, inci, slug, summary, monograph, sort_order")
        .eq("status", "published")
        .order("sort_order")
        .order("name");
      if (error) throw error;
      return data;
    },
  });
  const { data: products } = useSuspenseQuery(catalogQueryOptions(undefined, false));

  const [activeGroup, setActiveGroup] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredIngredients = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return ingredients.filter((ingredient) => {
      const matchesGroup =
        activeGroup === "all" || classifyMonograph(ingredient.slug, ingredient.name, ingredient.inci) === activeGroup;
      const matchesSearch =
        !q ||
        ingredient.name.toLowerCase().includes(q) ||
        (ingredient.inci ?? "").toLowerCase().includes(q) ||
        ingredient.summary.toLowerCase().includes(q);
      return matchesGroup && matchesSearch;
    });
  }, [activeGroup, ingredients, searchQuery]);

  return (
    <Storefront>
      <section className="catalog-banner">
        <PageHeading
          eyebrow="The Formulation Monograph"
          title={
            <>
              Know every molecule in <em>your ritual.</em>
            </>
          }
          description="Transparent INCI nomenclature, extraction origins, and barrier compatibility notes for every published compound used across ZORVELLAE."
          imageSrc="/site-assets/generated/editorial_ingredients_macro_1795670127823.jpg"
          imageAlt="Fresh centella leaves, rosehip lipid droplets, and raw colloidal oat grains arranged on travertine"
        />
      </section>

      <section className="ingredients-library-section">
        <div className="routine-builder-inner">
          <div className="ingredients-controls-bar">
            <div className="concern-tab-strip routine-tab-strip" role="tablist" aria-label="Filter ingredients by compound class">
              {CATEGORY_GROUPS.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  role="tab"
                  aria-selected={activeGroup === group.id}
                  className={`concern-tab-button ${activeGroup === group.id ? "is-active" : ""}`}
                  onClick={() => setActiveGroup(group.id)}
                >
                  {group.label}
                </button>
              ))}
            </div>

            <label className="ingredients-search-box">
              <Search size={14} aria-hidden="true" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Filter by name or INCI…"
                aria-label="Filter ingredient monographs"
              />
            </label>
          </div>

          {filteredIngredients.length === 0 ? (
            <div className="empty-catalog">
              <span className="catalog-mark">Z</span>
              <span className="eyebrow">No monographs match</span>
              <h2>Adjust your filter or search query.</h2>
              <p>Clear your keyword filter to inspect all published botanical and clinical actives.</p>
              <button
                type="button"
                className="text-link"
                onClick={() => {
                  setActiveGroup("all");
                  setSearchQuery("");
                }}
              >
                Reset library filters <ArrowRight size={13} aria-hidden="true" />
              </button>
            </div>
          ) : (
            <div className="article-grid ingredients-grid">
              {filteredIngredients.map((ingredient, index) => {
                const matchingProducts = products.filter((product) =>
                  `${product.ingredients ?? ""} ${product.name}`.toLowerCase().includes(ingredient.name.split(" ")[0]?.toLowerCase() ?? ""),
                );
                return (
                  <article className="article-item monograph-card" key={ingredient.id}>
                    <div className="monograph-card-head">
                      <span className="section-kicker">Monograph {String(index + 1).padStart(2, "0")}</span>
                      <span className="monograph-inci-label">{ingredient.inci || "Botanical Active"}</span>
                    </div>
                    <h2>{ingredient.name}</h2>
                    <p>{ingredient.summary}</p>
                    {ingredient.monograph && (
                      <details className="monograph-details" open={index < 2}>
                        <summary>Clinical &amp; mechanism notes</summary>
                        <p>{ingredient.monograph}</p>
                      </details>
                    )}
                    {matchingProducts.length > 0 && (
                      <div className="monograph-found-in">
                        <span className="concern-detail-label">Formulated in</span>
                        <div className="monograph-product-links">
                          {matchingProducts.slice(0, 2).map((product) => (
                            <Link key={product.id} to="/product/$slug" params={{ slug: product.slug }}>
                              {product.name} <ArrowRight size={11} aria-hidden="true" />
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </Storefront>
  );
}