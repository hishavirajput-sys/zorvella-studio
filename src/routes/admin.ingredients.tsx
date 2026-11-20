import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { AdminGate } from "@/components/admin";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/ingredients")({
  head: () => ({ meta: [
    { title: "Ingredient Monographs — ZORVELLAE" },
    { name: "description", content: "Review and prepare ingredient monographs for ZORVELLAE." },
    { property: "og:title", content: "Ingredient Monographs — ZORVELLAE" },
    { property: "og:description", content: "Manage approved ingredient information for ZORVELLAE." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  loader: ({ context }) => context.queryClient.ensureQueryData({ queryKey: ["admin", "ingredients"], queryFn: async () => {
    const { data, error } = await supabase.from("ingredients").select("id,name,inci,slug,summary,status").order("sort_order");
    if (error) throw error;
    return data;
  } }),
  component: IngredientsAdminPage,
});

function IngredientsAdminPage() {
  const queryClient = useQueryClient();
  const { data: ingredients } = useSuspenseQuery({ queryKey: ["admin", "ingredients"], queryFn: async () => {
    const { data, error } = await supabase.from("ingredients").select("id,name,inci,slug,summary,status").order("sort_order");
    if (error) throw error;
    return data;
  } });
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    const name = String(fields.get("name") ?? "").trim();
    const slug = String(fields.get("slug") ?? "").trim().toLowerCase();
    const inci = String(fields.get("inci") ?? "").trim();
    const summary = String(fields.get("summary") ?? "").trim();
    if (name.length < 2 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return setError("Add a valid ingredient name and URL name.");
    const { error: saveError } = await supabase.from("ingredients").insert({ name, slug, inci, summary, sort_order: ingredients.length + 1, status: "draft" });
    if (saveError) {
      setError(saveError.code === "23505" ? "An ingredient already uses that URL name." : "The ingredient could not be saved.");
    } else {
      form.reset(); setError(""); toast.success("Your ingredient draft has been saved."); await queryClient.invalidateQueries();
    }
  }
  async function unpublish(id: string) {
    const { error } = await supabase.from("ingredients").update({ status: "draft" }).eq("id", id);
    if (error) {
      toast.error("Ingredient visibility could not be updated.");
    } else {
      toast.success("The ingredient is now a draft."); await queryClient.invalidateQueries();
    }
  }
  async function publish(id: string) {
    const { error } = await supabase.from("ingredients").update({ status: "published" }).eq("id", id);
    if (error) {
      toast.error("Ingredient visibility could not be updated.");
    } else {
      toast.success("The ingredient is now visible to visitors."); await queryClient.invalidateQueries();
    }
  }
  return <AdminGate><h2 className="admin-page-heading">Ingredient monographs</h2><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Name</th><th>INCI</th><th>Status</th><th>Action</th></tr></thead><tbody>{ingredients.length ? ingredients.map((ingredient) => <tr key={ingredient.id}><td>{ingredient.name}</td><td>{ingredient.inci || "—"}</td><td>{ingredient.status}</td><td><Button variant="ghost" size="sm" onClick={() => void (ingredient.status === "published" ? unpublish(ingredient.id) : publish(ingredient.id))}>{ingredient.status === "published" ? "Unpublish" : "Publish"}</Button></td></tr>) : <tr><td colSpan={4}>No approved ingredient monographs. Do not publish unverified claims.</td></tr>}</tbody></table></div><form className="admin-add-form" onSubmit={submit}><h3 className="admin-subheading">Create a draft monograph</h3><label>Ingredient name<input className="store-field" name="name" maxLength={120} minLength={2} required /></label><label>INCI name<input className="store-field" name="inci" maxLength={160} /></label><label>URL name<input className="store-field" name="slug" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength={140} required /></label><label>Summary<input className="store-field" name="summary" maxLength={500} /></label><Button type="submit" className="store-link admin-add-button">Save draft</Button>{error && <p className="auth-error" role="alert">{error}</p>}</form></AdminGate>;
}