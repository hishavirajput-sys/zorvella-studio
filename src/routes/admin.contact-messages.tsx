import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { AdminGate } from "@/components/admin";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/contact-messages")({
  loader: ({ context }) => context.queryClient.ensureQueryData({ queryKey: ["admin", "contact-messages"], queryFn: async () => {
    const { data, error } = await supabase.from("contact_messages").select("id, name, email, subject, message, status, created_at").order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  } }),
  component: ContactMessagesPage,
});

function ContactMessagesPage() {
  const queryClient = useQueryClient();
  const { data: messages } = useSuspenseQuery({ queryKey: ["admin", "contact-messages"], queryFn: async () => {
    const { data, error } = await supabase.from("contact_messages").select("id, name, email, subject, message, status, created_at").order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  } });
  async function updateStatus(id: string, status: string) {
    const { error } = await supabase.from("contact_messages").update({ status }).eq("id", id);
    if (error) {
      toast.error("Message status could not be updated.");
    } else {
      toast.success("Message status updated.");
      await queryClient.invalidateQueries({ queryKey: ["admin", "contact-messages"] });
    }
  }
  return <AdminGate><h2 className="admin-page-heading">Customer messages</h2><p className="account-lead">Messages are kept for your review. Customer email notifications are not configured.</p>{messages.length ? messages.map((message) => <article className="admin-message" key={message.id}><div className="admin-message-header"><div><span className="eyebrow">{message.status} · {new Date(message.created_at).toLocaleDateString()}</span><h3>{message.subject}</h3><p>{message.name} · {message.email}</p></div><select aria-label={`Set status for message about ${message.subject}`} value={message.status} onChange={(event) => void updateStatus(message.id, event.target.value)}><option value="new">New</option><option value="read">Read</option><option value="replied">Replied</option><option value="archived">Archived</option></select></div><p>{message.message}</p><Button variant="outline" size="sm" asChild><a href={`mailto:${encodeURIComponent(message.email)}?subject=${encodeURIComponent(`Re: ${message.subject}`)}`}>Open email</a></Button></article>) : <div className="empty-catalog"><h2>No new messages.</h2><p>Customer inquiries will appear here.</p></div>}</AdminGate>;
}