import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { AdminGate } from "@/components/admin";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/content")({
  loader: ({ context }) => context.queryClient.ensureQueryData({ queryKey: ["admin", "content"], queryFn: async () => {
    const { data, error } = await supabase.from("content_pages").select("id,page_key,title,body,status,updated_at").order("page_key");
    if (error) throw error;
    return data;
  } }),
  component: ContentAdminPage,
});

function ContentAdminPage() {
  const queryClient = useQueryClient();
  const { data: pages } = useSuspenseQuery({ queryKey: ["admin", "content"], queryFn: async () => {
    const { data, error } = await supabase.from("content_pages").select("id,page_key,title,body,status,updated_at").order("page_key");
    if (error) throw error;
    return data;
  } });
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    const page_key = String(fields.get("page_key") ?? "").trim().toLowerCase();
    const title = String(fields.get("title") ?? "").trim();
    const body = String(fields.get("body") ?? "").trim();
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(page_key) || title.length < 2 || !body) return setError("Add a short page name, title, and approved page copy.");
    const { error } = await supabase.from("content_pages").insert({ page_key, title, body });
    if (error) {
      setError(error.code === "23505" ? "A content page already uses that page name." : "The new content page could not be saved.");
    } else {
      form.reset(); setError(""); toast.success("The draft page has been saved."); await queryClient.invalidateQueries();
    }
  }
  async function togglePublish(id: string, status: string) {
    const { error } = await supabase.from("content_pages").update({ status: status === "published" ? "draft" : "published" }).eq("id", id);
    if (error) {
      toast.error("The page status could not be changed.");
    } else {
      toast.success("Page status updated."); await queryClient.invalidateQueries();
    }
  }
  return <AdminGate><h2 className="admin-page-heading">Published store content</h2><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Page name</th><th>Title</th><th>Status</th><th>Action</th></tr></thead><tbody>{pages.length ? pages.map((page) => <tr key={page.id}><td>{page.page_key}</td><td>{page.title}</td><td>{page.status}</td><td><Button size="sm" variant="ghost" onClick={() => void togglePublish(page.id, page.status)}>{page.status === "published" ? "Unpublish" : "Publish"}</Button></td></tr>) : <tr><td colSpan={4}>No content pages have been added yet.</td></tr>}</tbody></table></div><h3 className="admin-subheading">Add approved copy</h3><form className="admin-add-form" onSubmit={submit}><label>Page address<input className="store-field" name="page_key" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required maxLength={100} /></label><label>Title<input className="store-field" name="title" maxLength={180} required /></label><label>Body<textarea className="store-field store-textarea" name="body" maxLength={15000} required /></label><Button type="submit" className="store-link admin-add-button">Save as draft</Button>{error && <p className="auth-error" role="alert">{error}</p>}</form></AdminGate>;
}