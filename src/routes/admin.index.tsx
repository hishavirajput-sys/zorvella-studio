import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { PageHeading } from "@/components/storefront";
import { AdminGate } from "@/routes/admin";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/")({
  loader: ({ context }) => context.queryClient.ensureQueryData({ queryKey: ["admin", "overview"], queryFn: async () => {
    const [products, categories, orders, customers, messages, inventory] = await Promise.all([
      supabase.from("products").select("id", { count: "exact", head: true }),
      supabase.from("categories").select("id", { count: "exact", head: true }),
      supabase.from("orders").select("id", { count: "exact", head: true }),
      supabase.from("legacy_user_mappings").select("user_id", { count: "exact", head: true }),
      supabase.from("contact_messages").select("id", { count: "exact", head: true }),
      supabase.from("inventory_adjustments").select("id", { count: "exact", head: true }),
    ]);
    const error = [products, categories, orders, customers, messages, inventory].find((result) => result.error)?.error;
    if (error) throw error;
    return [
      ["Published product listings", products.count ?? 0],
      ["Categories", categories.count ?? 0],
      ["Customer orders", orders.count ?? 0],
      ["Imported customers", customers.count ?? 0],
      ["Contact messages", messages.count ?? 0],
      ["Inventory records", inventory.count ?? 0],
    ] as const;
  } }),
  component: AdminDashboardPage,
});

function AdminDashboardPage() {
  const { data: summary } = useSuspenseQuery({ queryKey: ["admin", "overview"], queryFn: async () => {
    const [products, categories, orders, customers, messages, inventory] = await Promise.all([
      supabase.from("products").select("id", { count: "exact", head: true }),
      supabase.from("categories").select("id", { count: "exact", head: true }),
      supabase.from("orders").select("id", { count: "exact", head: true }),
      supabase.from("legacy_user_mappings").select("user_id", { count: "exact", head: true }),
      supabase.from("contact_messages").select("id", { count: "exact", head: true }),
      supabase.from("inventory_adjustments").select("id", { count: "exact", head: true }),
    ]);
    const error = [products, categories, orders, customers, messages, inventory].find((result) => result.error)?.error;
    if (error) throw error;
    return [["Published product listings", products.count ?? 0], ["Categories", categories.count ?? 0], ["Customer orders", orders.count ?? 0], ["Imported customers", customers.count ?? 0], ["Contact messages", messages.count ?? 0], ["Inventory records", inventory.count ?? 0]] as const;
  } });
  return <AdminGate><div className="admin-dashboard"><PageHeading eyebrow="A considered overview" title="Store overview" description="Published content, customer activity and day-to-day store operations." /><div className="admin-metrics">{summary.map(([label, count]) => <article className="admin-metric" key={label}><span>{label}</span><strong>{count}</strong></article>)}</div><p className="account-lead">New listings, orders and customer records will appear once approved store details and the original database export are added.</p></div></AdminGate>;
}