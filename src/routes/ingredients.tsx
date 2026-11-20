import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

import { PageHeading, Storefront } from "@/components/storefront";
import { type Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/ingredients")({
  head: () => ({ meta: [
    { title: "Ingredient Library — ZORVELLAE" },
    { name: "description", content: "Read published ingredient monographs and details for verified ZORVELLAE skincare formulations." },
    { property: "og:title", content: "Ingredient Library — ZORVELLAE" },
    { property: "og:description", content: "Explore published ZORVELLAE ingredient monographs." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  loader: ({ context }) => context.queryClient.ensureQueryData({ queryKey: ["store", "ingredients"], queryFn: async () => {
    const { data, error } = await supabase.from("ingredients").select("id, name, inci, slug, summary, monograph, sort_order").eq("status", "published").order("sort_order").order("name");
    if (error) throw error;
    return data;
  } }),
  component: IngredientLibrary,
});

function IngredientLibrary() {
  const { data: ingredients } = useSuspenseQuery({ queryKey: ["store", "ingredients"], queryFn: async () => {
    const { data, error } = await supabase.from("ingredients").select("id, name, inci, slug, summary, monograph, sort_order").eq("status", "published").order("sort_order").order("name");
    if (error) throw error;
    return data;
  } });
  return <Storefront><section className="catalog-banner"><PageHeading eyebrow="The formulation monograph" title="Know what goes into your skincare." description="A clear, considered guide to the ingredients in published formulations." /></section><section className="simple-page-content">{ingredients.length === 0 ? <div className="empty-catalog"><span className="eyebrow">Our monographs are being prepared</span><h2>Published ingredients will appear here.</h2><p>No ingredients or scientific claims have been invented for this preview.</p></div> : <div className="article-grid">{ingredients.map((ingredient) => <article className="article-item" key={ingredient.id}><span className="eyebrow">{ingredient.inci || "Ingredient monograph"}</span><h2>{ingredient.name}</h2><p>{ingredient.summary}</p>{ingredient.monograph && <details><summary>Read the monograph</summary><p>{ingredient.monograph}</p></details>}</article>)}</div>}</section></Storefront>;
}