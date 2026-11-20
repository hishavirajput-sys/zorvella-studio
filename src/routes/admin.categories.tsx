import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { AdminGate } from "@/components/admin";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/categories")({
  head: () => ({ meta: [
    { title: "Product Categories — ZORVELLAE" },
    { name: "description", content: "Review and prepare product categories for the ZORVELLAE storefront." },
    { property: "og:title", content: "Product Categories — ZORVELLAE" },
    { property: "og:description", content: "Manage the product categories shown in the ZORVELLAE shop." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  loader: ({ context }) => context.queryClient.ensureQueryData({ queryKey: ["admin", "categories"], queryFn: async () => {
    const { data, error } = await supabase.from("categories").select("*").order("sort_order");
    if (error) throw error;
    return data;
  } }),
  component: CategoriesPage,
});

function CategoriesPage() {
  const queryClient = useQueryClient();
  const { data: categories } = useSuspenseQuery({ queryKey: ["admin", "categories"], queryFn: async () => {
    const { data, error } = await supabase.from("categories").select("*").order("sort_order");
    if (error) throw error;
    return data;
  } });
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get("name") ?? "").trim();
    const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
    if (name.length < 2 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return setError("Add a category name and URL name using lowercase letters and dashes.");
    const { error: saveError } = await supabase.from("categories").insert({ name, slug, sort_order: categories.length + 1 });
    if (saveError) {
      setError(saveError.code === "23505" ? "A category already uses that URL name." : "The category could not be saved.");
    } else {
      form.reset();
      setError("");
      toast.success("Your category draft has been saved.");
      await queryClient.invalidateQueries();
    }
  }
  async function unpublish(id: string) {
    const { error: saveError } = await supabase.from("categories").update({ is_active: false, is_published: false }).eq("id", id);
    if (saveError) {
      toast.error("This category could not be unpublished.");
    } else {
      toast.success("The category is now hidden.");
      await queryClient.invalidateQueries();
    }
  }
  return <AdminGate><h2 className="admin-page-heading">Product categories</h2><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Name</th><th>URL name</th><th>Status</th><th>Action</th></tr></thead><tbody>{categories.length ? categories.map((category) => <tr key={category.id}><td>{category.name}</td><td>{category.slug}</td><td>{category.is_published ? "Published" : "Draft"}</td><td>{category.is_published && <Button type="button" variant="ghost" size="sm" onClick={() => void unpublish(category.id)}>Unpublish</Button>}</td></tr>) : <tr><td colSpan={4}>No categories yet.</td></tr>}</tbody></table></div><h3 className="admin-subheading">Create a draft category</h3><form className="admin-add-form" onSubmit={submit}><label>Name<input className="store-field" name="name" minLength={2} maxLength={120} required /></label><label>Page address (slug)<input className="store-field" name="slug" placeholder="a-short-name" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength={140} required /></label><Button type="submit" className="store-link admin-add-button">Save category</Button>{error && <p className="auth-error" role="alert">{error}</p>}</form></AdminGate>;
}