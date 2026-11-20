import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { AdminGate } from "@/routes/admin";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/store-domain";

export const Route = createFileRoute("/admin/orders")({
  loader: ({ context }) => context.queryClient.ensureQueryData({ queryKey: ["admin", "orders"], queryFn: async () => {
    const { data, error } = await supabase.from("orders").select("id, reference, contact_email, status, subtotal, currency, created_at").order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  } }),
  component: OrdersAdminPage,
});

const statuses = ["placed", "processing", "shipped", "delivered", "cancelled"] as const;

function OrdersAdminPage() {
  const queryClient = useQueryClient();
  const { data: orders } = useSuspenseQuery({ queryKey: ["admin", "orders"], queryFn: async () => {
    const { data, error } = await supabase.from("orders").select("id, reference, contact_email, status, subtotal, currency, created_at").order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  } });
  async function changeStatus(id: string, status: typeof statuses[number]) {
    const { error } = await supabase.from("orders").update({ status, status_history: [{ status, changedAt: new Date().toISOString() }] }).eq("id", id);
    if (error) return toast.error("Order status could not be updated.");
    toast.success("Order status updated.");
    await queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
    await queryClient.invalidateQueries({ queryKey: ["account", "orders"] });
  }
  return <AdminGate><h2 className="admin-page-heading">Customer order records</h2><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Reference</th><th>Customer</th><th>Date</th><th>Subtotal</th><th>Status</th></tr></thead><tbody>{orders.length === 0 ? <tr><td colSpan={5}>No customer order records. This preview has no connected payment provider.</td></tr> : orders.map((order) => <tr key={order.id}><td>{order.reference}</td><td>{order.contact_email}</td><td>{new Date(order.created_at).toLocaleDateString()}</td><td>{formatPrice(order.subtotal, order.currency.trim())}</td><td><select aria-label={`Set status for ${order.reference}`} value={order.status} onChange={(event) => { const value = event.target.value; if (statuses.includes(value as typeof statuses[number])) void changeStatus(order.id, value as typeof statuses[number]); }}><option value="placed">Placed</option><option value="processing">Processing</option><option value="shipped">Shipped</option><option value="delivered">Delivered</option><option value="cancelled">Cancelled</option></select></td></tr>)}</tbody></table></div></AdminGate>;
}