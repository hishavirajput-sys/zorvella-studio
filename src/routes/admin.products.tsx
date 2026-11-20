import { useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { formatPrice } from "@/components/storefront";
import { AdminGate } from "@/components/admin";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/admin/products")({
  loader: ({ context }) => context.queryClient.ensureQueryData({ queryKey: ["admin", "products"], queryFn: async () => {
    const { data, error } = await supabase.from("products").select("id, name, slug, price, currency, is_published, purchase_available, is_demo, variants").order("sort_order");
    if (error) throw error;
    return data;
  } }),
  component: AdminProductsPage,
});

function AdminProductsPage() {
  const queryClient = useQueryClient();
  const { data: products } = useSuspenseQuery({ queryKey: ["admin", "products"], queryFn: async () => {
    const { data, error } = await supabase.from("products").select("id, name, slug, price, currency, is_published, purchase_available, is_demo, variants").order("sort_order");
    if (error) throw error;
    return data;
  } });
  const { data: categories } = useSuspenseQuery({ queryKey: ["store", "categories"], queryFn: async () => {
    const { data, error } = await supabase.from("categories").select("id,name,slug").order("sort_order");
    if (error) throw error;
    return data;
  } });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    const name = String(fields.get("name") ?? "").trim();
    const slug = String(fields.get("slug") ?? "").trim().toLowerCase();
    const categoryId = String(fields.get("category") ?? "");
    const price = Number(fields.get("price"));
    const description = String(fields.get("description") ?? "").trim();
    const category = categories.find((entry) => entry.id === categoryId);
    if (name.length < 2 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || !category || !Number.isFinite(price) || price < 0 || description.length < 2) {
      setError("Add a title, valid URL name, category, price, and product description.");
      return;
    }
    const product: Database["public"]["Tables"]["products"]["Insert"] = {
      name, slug, description, category_id: category.id, category_label: category.name,
      price, currency: "USD", variants: [], is_active: false, is_published: false,
      is_demo: false, purchase_available: false, sort_order: products.length + 1,
    };
    setSaving(true);
    setError("");
    const { error: saveError } = await supabase.from("products").insert(product);
    setSaving(false);
    if (saveError) {
      setError(saveError.code === "23505" ? "A listing already uses that URL name." : "The listing could not be saved. Please try again.");
    } else {
      form.reset();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "products"] }),
        queryClient.invalidateQueries({ queryKey: ["store", "catalog"] }),
      ]);
      toast.success("The draft listing has been saved. Review its details before publishing.");
    }
  }
  async function unpublish(id: string) {
    const { error: updateError } = await supabase.from("products").update({ is_active: false, is_published: false, purchase_available: false }).eq("id", id);
    if (updateError) {
      toast.error("This listing could not be unpublished.");
    } else {
      toast.success("The listing is now hidden and cannot be purchased.");
      await queryClient.invalidateQueries();
    }
  }
  return <AdminGate><h2 className="admin-page-heading">Product listings</h2><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Formulation</th><th>Starting price</th><th>Visibility</th><th>Purchases</th><th>Actions</th></tr></thead><tbody>{products.length === 0 ? <tr><td colSpan={5}>No product records. Original MongoDB products were not included in the GitHub export.</td></tr> : products.map((product) => <tr key={product.id}><td><Link to="/product/$slug" params={{ slug: product.slug }}>{product.name}</Link><br />/{product.slug}</td><td>{formatPrice(product.price, product.currency)}</td><td>{product.is_published ? "Published" : "Draft"}</td><td>{product.is_demo ? "Demo · not for sale" : product.purchase_available ? "Available" : "Not available"}</td><td>{product.is_published && <Button type="button" variant="ghost" size="sm" onClick={() => void unpublish(product.id)}>Unpublish</Button>}</td></tr>)}</tbody></table></div><h3 className="admin-subheading">Create a draft listing</h3><form className="admin-add-form" onSubmit={submit}><label>Product name<input className="store-field" name="name" minLength={2} maxLength={140} required /></label><label>Page address (slug)<input className="store-field" name="slug" placeholder="a-short-name" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength={140} required /></label><label>Category<select className="store-field" name="category" required defaultValue=""><option value="" disabled>Choose a category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label>Starting price<input className="store-field" name="price" type="number" min="0" max="100000" step="0.01" required /></label><label>Description<textarea className="store-field store-textarea" name="description" minLength={2} maxLength={4000} required /></label><Button type="submit" className="store-link admin-add-button" disabled={saving || categories.length === 0}>{saving ? "Saving…" : "Save draft listing"}</Button>{error && <p className="auth-error" role="alert">{error}</p>}</form></AdminGate>;
}