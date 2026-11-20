import { useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { PageHeading, Storefront } from "@/components/storefront";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/contact")({
  head: () => ({ meta: [
    { title: "Contact Customer Care — ZORVELLAE" },
    { name: "description", content: "Send the ZORVELLAE customer care team a message." },
    { property: "og:title", content: "Contact ZORVELLAE" },
    { property: "og:description", content: "Get in touch with ZORVELLAE customer care." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  loader: ({ context }) => context.queryClient.ensureQueryData({ queryKey: ["store", "public-contact"], queryFn: async () => {
    const { data, error } = await supabase.from("store_settings").select("setting_value").eq("setting_key", "public.contact").maybeSingle();
    if (error) throw error;
    return data?.setting_value ?? null;
  } }),
  component: ContactPage,
});

function ContactPage() {
  const { data: contactDetails } = useSuspenseQuery({ queryKey: ["store", "public-contact"], queryFn: async () => {
    const { data, error } = await supabase.from("store_settings").select("setting_value").eq("setting_key", "public.contact").maybeSingle();
    if (error) throw error;
    return data?.setting_value ?? null;
  } });
  const contact = contactDetails && typeof contactDetails === "object" && !Array.isArray(contactDetails) ? contactDetails : null;
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const name = String(values.get("name") ?? "").trim();
    const email = String(values.get("email") ?? "").trim();
    const subject = String(values.get("subject") ?? "").trim();
    const message = String(values.get("message") ?? "").trim();
    if (name.length < 2 || name.length > 120 || !email || email.length > 254 || subject.length < 3 || subject.length > 200 || message.length < 5 || message.length > 2000) return setError("Please complete each field within the stated limits.");
    setSubmitting(true);
    setError("");
    const { error: submitError } = await supabase.from("contact_messages").insert({ name, email, subject, message });
    setSubmitting(false);
    if (submitError) {
      setError("Your message could not be sent just now. Please try again.");
      return;
    }
    toast.success("Your message was received.");
    await navigate({ to: "/contact/thank-you" });
  }
  return <Storefront><section className="catalog-banner"><PageHeading eyebrow="Here to help" title="We would love to hear from you." description="Write to our customer care team. We will handle your details with care." /></section><section className="simple-page-content">{contact && (typeof contact["email"] === "string" || typeof contact["phone"] === "string") && <p className="account-lead">{typeof contact["email"] === "string" && <a href={`mailto:${contact["email"]}`}>{contact["email"]}</a>}{typeof contact["email"] === "string" && typeof contact["phone"] === "string" ? " · " : ""}{typeof contact["phone"] === "string" && <a href={`tel:${contact["phone"]}`}>{contact["phone"]}</a>}</p>}<form className="contact-form" onSubmit={submit}><div className="contact-form-grid"><label className="contact-form-field"><span>Your name</span><input className="store-field" name="name" autoComplete="name" minLength={2} maxLength={120} required /></label><label className="contact-form-field"><span>Email address</span><input className="store-field" name="email" type="email" autoComplete="email" maxLength={254} required /></label><label className="contact-form-field"><span>Subject</span><input className="store-field" name="subject" minLength={3} maxLength={200} required /></label><label className="contact-form-field"><span>Your message</span><textarea className="store-field store-textarea" name="message" minLength={5} maxLength={2000} required /></label></div><button className="store-link address-form-submit" type="submit" disabled={submitting}>{submitting ? "Sending…" : "Send a message"}</button>{error && <p className="auth-error" role="alert">{error}</p>}<p className="account-lead">Messages are stored securely for the store team. A live email notification service is not configured yet.</p></form></section></Storefront>;
}
