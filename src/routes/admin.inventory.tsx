import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { AdminGate } from "@/components/admin";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/inventory")({
  loader: ({ context }) => context.queryClient.ensureQueryData({ queryKey: ["admin", "inventory"], queryFn: async () => {
    const { data, error } = await supabase.from("inventory_adjustments").select("id, product_id, variant_id, quantity_change, reason, changed_by, created_at, products(name)").order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  } }),
  component: InventoryPage,
});

function InventoryPage() {
  const { data: adjustments } = useSuspenseQuery({ queryKey: ["admin", "inventory"], queryFn: async () => {
    const { data, error } = await supabase.from("inventory_adjustments").select("id, product_id, variant_id, quantity_change, reason, changed_by, created_at, products(name)").order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  } });
  return <AdminGate><h2 className="admin-page-heading">Inventory activity</h2><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Date</th><th>Formulation</th><th>Size</th><th>Change</th><th>Reason</th></tr></thead><tbody>{adjustments.length ? adjustments.map((item) => <tr key={item.id}><td>{new Date(item.created_at).toLocaleDateString()}</td><td>{item.products?.name ?? "Product removed"}</td><td>{item.variant_id || "—"}</td><td>{item.quantity_change > 0 ? "+" : ""}{item.quantity_change}</td><td>{item.reason || "—"}</td></tr>) : <tr><td colSpan={5}>No inventory changes yet. Product variant stock is pending approved product records.</td></tr>}</tbody></table></div></AdminGate>;
}