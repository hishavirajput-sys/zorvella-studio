import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { PageHeading } from "@/components/storefront";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [
    { title: "Store Studio Overview — ZORVELLAE" },
    { name: "description", content: "Private overview of ZORVELLAE products, categories, and order activity." },
    { property: "og:title", content: "Store Studio Overview — ZORVELLAE" },
    { property: "og:description", content: "A secure overview for ZORVELLAE store managers." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  loader: ({ context }) => context.queryClient.ensureQueryData({ queryKey: ["admin", "overview"], queryFn: async () => {
    const [products, categories, orders, customers, messages, inventory, settings] = await Promise.all([
      supabase.from("products").select("id", { count: "exact", head: true }),
      supabase.from("categories").select("id", { count: "exact", head: true }),
      supabase.from("orders").select("id", { count: "exact", head: true }),
      supabase.from("legacy_user_mappings").select("user_id", { count: "exact", head: true }),
      supabase.from("contact_messages").select("id", { count: "exact", head: true }),
      supabase.from("inventory_adjustments").select("id", { count: "exact", head: true }),
      supabase.from("store_settings").select("setting_key", { count: "exact", head: true }),
    ]);
    const error = [products, categories, orders, customers, messages, inventory, settings].find((result) => result.error)?.error;
    if (error) throw error;
    return [
      ["Published product listings", products.count ?? 0],
      ["Categories", categories.count ?? 0],
      ["Customer orders", orders.count ?? 0],
      ["Imported customers", customers.count ?? 0],
      ["Contact messages", messages.count ?? 0],
      ["Inventory records", inventory.count ?? 0],
      ["Store settings", settings.count ?? 0],
    ] as const;
  } }),
  component: AdminDashboardPage,
});

function AdminDashboardPage() {
  const queryClient = useQueryClient();
  const [checked, setChecked] = useState(false);
  useEffect(() => {
    let active = true;
    void supabase.auth.getUser().then(async ({ data, error }) => {
      if (error || !data.user) return;
      const { data: role, error: roleError } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id).eq("role", "admin").maybeSingle();
      if (active && role && !roleError) {
        setChecked(true);
        void queryClient.invalidateQueries({ queryKey: ["admin", "overview"] });
      }
    });
    return () => { active = false; };
  }, [queryClient]);
  const { data: summary } = useSuspenseQuery({ queryKey: ["admin", "overview"], queryFn: async () => {
    const [products, categories, orders, customers, messages, inventory, settings] = await Promise.all([
      supabase.from("products").select("id", { count: "exact", head: true }),
      supabase.from("categories").select("id", { count: "exact", head: true }),
      supabase.from("orders").select("id", { count: "exact", head: true }),
      supabase.from("legacy_user_mappings").select("user_id", { count: "exact", head: true }),
      supabase.from("contact_messages").select("id", { count: "exact", head: true }),
      supabase.from("inventory_adjustments").select("id", { count: "exact", head: true }),
      supabase.from("store_settings").select("setting_key", { count: "exact", head: true }),
    ]);
    const error = [products, categories, orders, customers, messages, inventory, settings].find((result) => result.error)?.error;
    if (error) throw error;
    return [["Published product listings", products.count ?? 0], ["Categories", categories.count ?? 0], ["Customer orders", orders.count ?? 0], ["Imported customers", customers.count ?? 0], ["Contact messages", messages.count ?? 0], ["Inventory records", inventory.count ?? 0], ["Store settings", settings.count ?? 0]] as const;
  } });
  return <div className="admin-dashboard"><PageHeading eyebrow="A considered overview" title="Store overview" description="Published content, customer activity and day-to-day store operations." /><div className="admin-metrics">{(checked ? summary : summary.filter(([label]) => label === "Published product listings" || label === "Categories" || label === "Customer orders")).map(([label, count]) => <article className="admin-metric" key={label}><span>{label}</span><strong>{count}</strong></article>)}</div><p className="account-lead">New listings, categories, ingredients, and customer inquiries appear here as you manage them in Store Studio.</p></div>;
}