import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { AdminGate } from "@/routes/admin";
import { supabase } from "@/integrations/supabase/client";
import { startSocialSignIn } from "@/components/storefront";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({ meta: [
    { title: "Store Settings — ZORVELLAE" },
    { name: "description", content: "Review and update public contact settings for ZORVELLAE." },
    { property: "og:title", content: "Store Settings — ZORVELLAE" },
    { property: "og:description", content: "Control public settings for the ZORVELLAE store." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  loader: ({ context }) => context.queryClient.ensureQueryData({ queryKey: ["admin", "store-settings"], queryFn: async () => {
    const { data, error } = await supabase.from("store_settings").select("setting_key,setting_value,updated_at").order("setting_key");
    if (error) throw error;
    return data;
  } }),
  component: SettingsPage,
});

function SettingsPage() {
  const queryClient = useQueryClient();
  const { data: settings } = useSuspenseQuery({ queryKey: ["admin", "store-settings"], queryFn: async () => {
    const { data, error } = await supabase.from("store_settings").select("setting_key,setting_value,updated_at").order("setting_key");
    if (error) throw error;
    return data;
  } });
  const [error, setError] = useState("");
  async function saveSetting(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const contactEmail = String(values.get("contact_email") ?? "").trim();
    if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) return setError("Enter a valid customer-care email address.");
    const settingValue = contactEmail ? { email: contactEmail } : { email: null };
    const { error: saveError } = await supabase.from("store_settings").upsert({ setting_key: "public.contact", setting_value: settingValue });
    if (saveError) return setError("The contact details could not be saved.");
    setError("");
    toast.success("Public customer-care details updated.");
    await queryClient.invalidateQueries({ queryKey: ["admin", "store-settings"] });
  }
  const currentContact = settings.find((setting) => setting.setting_key === "public.contact");
  const email = currentContact?.setting_value && typeof currentContact.setting_value === "object" && !Array.isArray(currentContact.setting_value) && typeof currentContact.setting_value.email === "string" ? currentContact.setting_value.email : "";
  return <AdminGate><h2 className="admin-page-heading">Public store details</h2><p className="account-lead">Public details on your shop are only changed here.</p><form className="admin-add-form" onSubmit={saveSetting}><label>Customer-care email<input className="store-field" name="contact_email" type="email" maxLength={254} defaultValue={email} placeholder="care@example.com" /></label><Button type="submit" className="store-link admin-add-button">Save customer-care details</Button>{error && <p className="auth-error" role="alert">{error}</p>}</form><section className="admin-settings-notice"><h3>Product availability</h3><p>Product publishing and availability must be approved separately for each formulation. Development samples can never be offered for purchase.</p></section><section className="admin-settings-notice"><h3>Account security</h3><p>Store-manager access is checked against a separate secure role. This account list does not trust browser storage or editable profile details.</p></section><section className="admin-settings-notice"><h3>Bring in an existing account</h3><p>Sign in with the email of the store owner first. The customer email and source database export still need to be supplied before the original customers can be matched.</p><Button type="button" variant="outline" onClick={() => void startSocialSignIn("google").catch(() => toast.error("Google sign-in could not be started."))}>Sign in to confirm owner email</Button></section></AdminGate>;
}