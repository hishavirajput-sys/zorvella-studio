import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

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
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const { data: mappings } = useSuspenseQuery({ queryKey: ["admin", "customers"], queryFn: async () => {
    const { data, error } = await supabase.from("legacy_user_mappings").select("legacy_user_id,user_id,imported_at").order("imported_at", { ascending: false });
    if (error) throw error;
    return data;
  } });
  const filteredMappings = mappings.filter((mapping) => mapping.legacy_user_id.toLowerCase().includes(search.trim().toLowerCase()));
  async function removeMapping(userId: string) {
    if (!window.confirm("Unlink this imported customer identity? This does not delete the customer account.")) return;
    const { error } = await supabase.from("legacy_user_mappings").delete().eq("user_id", userId);
    if (error) toast.error("This legacy account link could not be removed.");
    else { toast.success("Legacy account link removed."); await queryClient.invalidateQueries({ queryKey: ["admin", "customers"] }); }
  }
  return <><h2 className="admin-page-heading">Customer identity records</h2><p className="account-lead">Search imported account links to audit customer identity matching. Passwords and active sessions never transfer.</p><label className="admin-search-label">Search by original account reference<input className="store-field" value={search} onChange={(event) => setSearch(event.target.value)} maxLength={180} /></label><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Previous account reference</th><th>New account reference</th><th>Imported</th><th>Action</th></tr></thead><tbody>{filteredMappings.length ? filteredMappings.map((mapping) => <tr key={mapping.user_id}><td>{mapping.legacy_user_id}</td><td>{mapping.user_id}</td><td>{new Date(mapping.imported_at).toLocaleDateString()}</td><td><Button size="sm" variant="ghost" onClick={() => void removeMapping(mapping.user_id)}>Unlink</Button></td></tr>) : <tr><td colSpan={4}>{mappings.length ? "No customer links match your search." : "No imported customer identities. Request the MongoDB user export to begin verified account linking."}</td></tr>}</tbody></table></div></>;
}