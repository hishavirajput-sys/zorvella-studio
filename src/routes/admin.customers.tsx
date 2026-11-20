import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { AdminGate } from "@/components/admin";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/customers")({
  head: () => ({ meta: [
    { title: "Customer Accounts — ZORVELLAE" },
    { name: "description", content: "Review imported customer records and identity mappings." },
    { property: "og:title", content: "Customer Accounts — ZORVELLAE" },
    { property: "og:description", content: "Manage migrated ZORVELLAE customer records." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  loader: ({ context }) => context.queryClient.ensureQueryData({ queryKey: ["admin", "customers"], queryFn: async () => {
    const { data, error } = await supabase.from("legacy_user_mappings").select("legacy_user_id,user_id,imported_at").order("imported_at", { ascending: false });
    if (error) throw error;
    return data;
  } }),
  component: CustomersPage,
});

function CustomersPage() {
  const { data: mappings } = useSuspenseQuery({ queryKey: ["admin", "customers"], queryFn: async () => {
    const { data, error } = await supabase.from("legacy_user_mappings").select("legacy_user_id,user_id,imported_at").order("imported_at", { ascending: false });
    if (error) throw error;
    return data;
  } });
  return <AdminGate><h2 className="admin-page-heading">Customer identity records</h2><p className="account-lead">Existing accounts are not imported until original customer and identity files are supplied and verified. Passwords and active sessions cannot transfer.</p><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Previous account reference</th><th>New account reference</th><th>Imported</th></tr></thead><tbody>{mappings.length ? mappings.map((mapping) => <tr key={mapping.user_id}><td>{mapping.legacy_user_id}</td><td>{mapping.user_id}</td><td>{new Date(mapping.imported_at).toLocaleDateString()}</td></tr>) : <tr><td colSpan={3}>No imported customer identities. Request the MongoDB users export to begin verified account linking.</td></tr>}</tbody></table></div></AdminGate>;
}