import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/inventory")({
  head: () => ({ meta: [
    { title: "Inventory Activity — ZORVELLAE" },
    { name: "description", content: "Review and adjust formulation stock counts and history." },
    { property: "og:title", content: "Inventory Activity — ZORVELLAE" },
    { property: "og:description", content: "Manage stock by product size." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  loader: ({ context }) => context.queryClient.ensureQueryData({ queryKey: ["admin", "inventory"], queryFn: async () => {
    const { data, error } = await supabase.from("products").select("id,name,slug,variants,stock_by_variant,low_stock_threshold,is_demo").order("name");
    if (error) throw error;
    return data;
  } }),
  component: InventoryPage,
});

type ProductVariant = { id: string; label: string; price: number };
type InventoryProduct = {
  id: string; name: string; slug: string; is_demo: boolean; low_stock_threshold: number;
  stock_by_variant: Record<string, number>; variants: ProductVariant[];
};
type Adjustment = { adjustment_id: string; previous_quantity: number | null; new_quantity: number; action: string; adjustment_amount: number; reason: string; created_at: string };

function readVariants(value: unknown): ProductVariant[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return [];
    const id = entry["id"]; const label = entry["label"]; const price = entry["price"];
    return typeof id === "string" && typeof label === "string" && typeof price === "number" ? [{ id, label, price }] : [];
  });
}

function InventoryPage() {
  const queryClient = useQueryClient();
  const { data: rawProducts } = useSuspenseQuery({ queryKey: ["admin", "inventory"], queryFn: async () => {
    const { data, error } = await supabase.from("products").select("id,name,slug,variants,stock_by_variant,low_stock_threshold,is_demo").order("name");
    if (error) throw error;
    return data;
  } });
  const products: InventoryProduct[] = rawProducts.map((product) => ({
    ...product,
    variants: readVariants(product.variants),
    stock_by_variant: product.stock_by_variant && typeof product.stock_by_variant === "object" && !Array.isArray(product.stock_by_variant)
      ? product.stock_by_variant as Record<string, number>
      : {},
  }));
  const [filter, setFilter] = useState("all");
  const [historyFor, setHistoryFor] = useState<{ productId: string; variantId: string } | null>(null);
  const [history, setHistory] = useState<Adjustment[]>([]);
  const [reasonError, setReasonError] = useState("");
  const [pending, setPending] = useState("");
  async function adjustStock(event: FormEvent<HTMLFormElement>, product: InventoryProduct, variant: ProductVariant) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    const action = String(fields.get("action") ?? "set");
    const amount = Number(fields.get("quantity"));
    const reason = String(fields.get("reason") ?? "").trim();
    const existing = product.stock_by_variant[variant.id];
    if (!Number.isSafeInteger(amount) || amount < (action === "set" ? 0 : 1) || amount > 1_000_000 || reason.length < 3 || reason.length > 500) {
      setReasonError("Enter a whole number and a reason of 3–500 characters.");
      return;
    }
    if (product.is_demo) {
      setReasonError("Demo listings cannot have sellable stock.");
      return;
    }
    if (action !== "set" && typeof existing !== "number") {
      setReasonError("Set a verified physical count before increasing or decreasing stock.");
      return;
    }
    if (action === "decrement" && typeof existing === "number" && amount > existing) {
      setReasonError("Stock cannot be reduced below zero.");
      return;
    }
    setPending(variant.id); setReasonError("");
    const { data, error } = await supabase.rpc("adjust_product_inventory", {
      p_product_id: product.id,
      p_variant_id: variant.id,
      p_action: action,
      p_quantity: amount,
      p_reason: reason,
    });
    setPending("");
    if (error) {
      setReasonError(error.code === "42501" ? "Your account is not permitted to change stock." : error.message.includes("zero") ? "Stock cannot be reduced below zero." : "Stock could not be updated. Verify the count and try again.");
      return;
    }
    toast.success("Stock count and adjustment history updated.");
    await queryClient.invalidateQueries({ queryKey: ["admin", "inventory"] });
    await queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
    if (historyFor?.productId === product.id && historyFor.variantId === variant.id) await loadHistory(product.id, variant.id);
    form.reset();
  }
  async function loadHistory(productId: string, variantId: string) {
    setHistoryFor({ productId, variantId });
    const { data, error } = await supabase.from("inventory_adjustments").select("id,previous_quantity,new_quantity,action,adjustment_amount,reason,created_at").eq("product_id", productId).eq("variant_id", variantId).order("created_at", { ascending: false }).limit(10);
    if (error) {
      toast.error("Adjustment history could not be loaded.");
      setHistory([]);
      return;
    }
    setHistory(data.map((entry) => ({ adjustment_id: entry.id, previous_quantity: entry.previous_quantity, new_quantity: entry.new_quantity, action: entry.action, adjustment_amount: entry.adjustment_amount, reason: entry.reason, created_at: entry.created_at })));
  }
  const variants = products.flatMap((product) => product.variants.map((variant) => ({ product, variant, quantity: product.stock_by_variant[variant.id] })));
  const visible = variants.filter(({ quantity }) => filter === "all" || (filter === "untracked" ? typeof quantity !== "number" : filter === "out_of_stock" ? quantity === 0 : filter === "low_stock" ? typeof quantity === "number" && quantity > 0 && quantity <= 5 : typeof quantity === "number" && quantity > 5));
  return <><h2 className="admin-page-heading">Stock by product size</h2><p className="account-lead">An untracked count is not the same as zero. Verified physical counts are required before stock can be increased or removed; checkout does not change stock.</p><label className="admin-search-label">Show<select className="store-field" value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">All sizes</option><option value="in_stock">In stock</option><option value="low_stock">Low stock (1–5)</option><option value="out_of_stock">Out of stock</option><option value="untracked">Untracked</option></select></label>{visible.length === 0 ? <p className="account-lead">No product sizes match this filter.</p> : visible.map(({ product, variant, quantity }) => <article className="inventory-variant" key={`${product.id}-${variant.id}`}><div className="inventory-variant-head"><div><span className="eyebrow">{product.is_demo ? "Demo · not for sale" : typeof quantity === "number" ? quantity === 0 ? "Out of stock" : quantity <= 5 ? "Low stock" : "In stock" : "Untracked"}</span><h3>{product.name} · {variant.label}</h3><p>SKU {variant.id}</p></div><strong>{typeof quantity === "number" ? `${quantity} units` : "Not counted"}</strong></div><form className="inventory-adjust-form" onSubmit={(event) => void adjustStock(event, product, variant)}><label>Action<select className="store-field" name="action" defaultValue="set"><option value="set">Set verified physical count</option><option value="increment" disabled={typeof quantity !== "number" || product.is_demo}>Add units</option><option value="decrement" disabled={typeof quantity !== "number" || product.is_demo}>Remove units</option></select></label><label>{"Set"} count or units<input className="store-field" type="number" name="quantity" min="0" max="1000000" step="1" required /></label><label>Reason<input className="store-field" name="reason" minLength={3} maxLength={500} required /></label><Button type="submit" variant="outline" size="sm" disabled={pending === variant.id || product.is_demo}>{pending === variant.id ? "Saving…" : "Save adjustment"}</Button><Button type="button" variant="ghost" size="sm" onClick={() => void loadHistory(product.id, variant.id)}>View recent history</Button>{reasonError && pending === "" && <p className="auth-error" role="alert">{reasonError}</p>}</form>{historyFor?.productId === product.id && historyFor.variantId === variant.id && <ol className="inventory-history">{history.length ? history.map((entry) => <li key={entry.adjustment_id}><strong>{entry.action === "set" ? "Count set" : entry.action === "increment" ? "Units added" : "Units removed"}: {entry.previous_quantity ?? "Untracked"} → {entry.new_quantity}</strong><span>{entry.reason}</span><time>{new Date(entry.created_at).toLocaleString()}</time></li>) : <li>No stock adjustments recorded for this size.</li>}</ol>}</article>)}</>;
}