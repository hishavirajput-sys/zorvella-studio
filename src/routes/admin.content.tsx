import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { AdminGate } from "@/components/admin";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/content")({
  head: () => ({ meta: [
    { title: "Content Drafts — ZORVELLAE" },
    { name: "description", content: "Review and prepare ZORVELLAE page copy for future publication." },
    { property: "og:title", content: "Content Drafts — ZORVELLAE" },
    { property: "og:description", content: "Manage store page copy drafts." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
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
  const [editingId, setEditingId] = useState("");
  const [pageKey, setPageKey] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    const submittedKey = String(fields.get("page_key") ?? "").trim().toLowerCase();
    const submittedTitle = String(fields.get("title") ?? "").trim();
    const submittedBody = String(fields.get("body") ?? "").trim();
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(submittedKey) || submittedTitle.length < 2 || !submittedBody) return setError("Add a short page name, title, and approved page copy.");
    const { error } = editingId
      ? await supabase.from("content_pages").update({ page_key: submittedKey, title: submittedTitle, body: submittedBody }).eq("id", editingId)
      : await supabase.from("content_pages").insert({ page_key: submittedKey, title: submittedTitle, body: submittedBody });
    if (error) {
      setError(error.code === "23505" ? "A content page already uses that page name." : "The new content page could not be saved.");
    } else {
      form.reset(); setError(""); setEditingId(""); setPageKey(""); setTitle(""); setBody(""); toast.success(editingId ? "Page copy updated." : "The draft page has been saved."); await queryClient.invalidateQueries();
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
  return <><h2 className="admin-page-heading">Store page copy</h2><p className="account-lead">Published copy appears on the About and Science pages when the page name matches their addresses. Other saved copy remains available here for review.</p><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Page name</th><th>Title</th><th>Status</th><th>Actions</th></tr></thead><tbody>{pages.length ? pages.map((page) => <tr key={page.id}><td>{page.page_key}</td><td>{page.title}</td><td>{page.status}</td><td><Button size="sm" variant="ghost" onClick={() => { setEditingId(page.id); setPageKey(page.page_key); setTitle(page.title); setBody(page.body); setError(""); document.getElementById("content-editor")?.scrollIntoView({ behavior: "smooth", block: "start" }); }}>Edit</Button> <Button size="sm" variant="ghost" onClick={() => void togglePublish(page.id, page.status)}>{page.status === "published" ? "Unpublish" : "Publish"}</Button></td></tr>) : <tr><td colSpan={4}>No content pages have been added yet.</td></tr>}</tbody></table></div><h3 className="admin-subheading" id="content-editor">{editingId ? "Edit page copy" : "Add approved copy"}</h3><form className="admin-add-form" onSubmit={submit}><label>Page address<input className="store-field" name="page_key" value={pageKey} onChange={(event) => setPageKey(event.target.value)} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required maxLength={100} /></label><label>Title<input className="store-field" name="title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={180} required /></label><label>Body<textarea className="store-field store-textarea" name="body" value={body} onChange={(event) => setBody(event.target.value)} maxLength={15000} required /></label><div className="admin-form-actions"><Button type="submit" className="store-link admin-add-button">{editingId ? "Save changes" : "Save as draft"}</Button>{editingId && <Button type="button" variant="outline" onClick={() => { setEditingId(""); setPageKey(""); setTitle(""); setBody(""); setError(""); }}>Cancel editing</Button>}</div>{error && <p className="auth-error" role="alert">{error}</p>}</form></>;
}