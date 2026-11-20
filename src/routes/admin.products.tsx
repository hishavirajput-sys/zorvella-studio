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
  head: () => ({ meta: [
    { title: "Product Listings — ZORVELLAE" },
    { name: "description", content: "Review and manage approved product listings for the ZORVELLAE store." },
    { property: "og:title", content: "Product Listings — ZORVELLAE" },
    { property: "og:description", content: "Manage product listings for ZORVELLAE." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  loader: ({ context }) => context.queryClient.ensureQueryData({ queryKey: ["admin", "products"], queryFn: async () => {
    const { data, error } = await supabase.from("products").select("id, name, slug, price, currency, is_active, is_published, purchase_available, is_demo, images, variants").order("sort_order");
    if (error) throw error;
    return data;
  } }),
  component: AdminProductsPage,
});

function AdminProductsPage() {
  const queryClient = useQueryClient();
  const { data: products } = useSuspenseQuery({ queryKey: ["admin", "products"], queryFn: async () => {
    const { data, error } = await supabase.from("products").select("id, name, slug, price, currency, is_active, is_published, purchase_available, is_demo, images, variants").order("sort_order");
    if (error) throw error;
    return data;
  } });
  const { data: categories } = useSuspenseQuery({ queryKey: ["admin", "categories"], queryFn: async () => {
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
    const variantLabel = String(fields.get("variant") ?? "").trim();
    const imageUrl = String(fields.get("image") ?? "").trim();
    const description = String(fields.get("description") ?? "").trim();
    const category = categories.find((entry) => entry.id === categoryId);
    let safeImageUrl = "";
    try {
      const parsedImageUrl = new URL(imageUrl);
      if (parsedImageUrl.protocol === "https:") safeImageUrl = parsedImageUrl.toString();
    } catch {
      safeImageUrl = "";
    }
    if (name.length < 2 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || !category || !Number.isFinite(price) || price < 0 || description.length < 2 || variantLabel.length < 1 || !safeImageUrl) {
      setError("Add the approved name, category, description, size, price, and HTTPS product photo.");
      return;
    }
    const product: Database["public"]["Tables"]["products"]["Insert"] = {
      name, slug, description, category_id: category.id, category_label: category.name,
      price, currency: "USD", variants: [{ id: "standard", label: variantLabel, price }],
      images: [{ url: safeImageUrl, alt: `${name} product photograph` }], is_active: false, is_published: false,
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
  async function publish(product: typeof products[number]) {
    const hasImage = Array.isArray(product.images) && product.images.some((image) => image && typeof image === "object" && !Array.isArray(image) && typeof image["url"] === "string" && image["url"].startsWith("https://"));
    const hasVariant = Array.isArray(product.variants) && product.variants.some((variant) => variant && typeof variant === "object" && !Array.isArray(variant) && typeof variant["label"] === "string" && typeof variant["price"] === "number" && variant["price"] > 0);
    if (product.is_demo || !hasImage || !hasVariant) {
      toast.error("Add an approved product photo, size and price before publishing.");
      return;
    }
    const { error: publishError } = await supabase.from("products").update({ is_active: true, is_published: true, purchase_available: false }).eq("id", product.id);
    if (publishError) toast.error("This listing could not be published.");
    else { toast.success("The listing is visible; checkout stays unavailable until payments are configured."); await queryClient.invalidateQueries(); }
  }
  return <><h2 className="admin-page-heading">Product listings</h2><p className="account-lead">Publishing makes a reviewed listing visible. No checkout or product can be purchased until payments are configured.</p><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Formulation</th><th>Starting price</th><th>Visibility</th><th>Purchases</th><th>Actions</th></tr></thead><tbody>{products.length === 0 ? <tr><td colSpan={5}>No product records. Original MongoDB products were not included in the GitHub export.</td></tr> : products.map((product) => <tr key={product.id}><td><Link to="/product/$slug" params={{ slug: product.slug }}>{product.name}</Link><br />/{product.slug}</td><td>{formatPrice(product.price, product.currency)}</td><td>{product.is_published ? "Published" : "Draft"}</td><td>{product.is_demo ? "Demo · not for sale" : product.purchase_available ? "Available" : "Not available"}</td><td>{product.is_published ? <Button type="button" variant="ghost" size="sm" onClick={() => void unpublish(product.id)}>Unpublish</Button> : <Button type="button" variant="ghost" size="sm" onClick={() => void publish(product)}>Publish</Button>}</td></tr>)}</tbody></table></div><h3 className="admin-subheading">Create a draft listing</h3><form className="admin-add-form" onSubmit={submit}><label>Product name<input className="store-field" name="name" minLength={2} maxLength={140} required /></label><label>Page address (slug)<input className="store-field" name="slug" placeholder="a-short-name" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength={140} required /></label><label>Category<select className="store-field" name="category" required defaultValue=""><option value="" disabled>Choose a category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label>Approved size<input className="store-field" name="variant" placeholder="30 ml" minLength={1} maxLength={80} required /></label><label>Starting price (USD)<input className="store-field" name="price" type="number" min="0.01" max="100000" step="0.01" required /></label><label>HTTPS product photograph<input className="store-field" name="image" type="url" maxLength={2000} placeholder="https://…" required /></label><label>Product description<textarea className="store-field store-textarea" name="description" minLength={2} maxLength={4000} required /></label><Button type="submit" className="store-link admin-add-button" disabled={saving || categories.length === 0}>{saving ? "Saving…" : "Save draft listing"}</Button>{error && <p className="auth-error" role="alert">{error}</p>}</form></>;
}