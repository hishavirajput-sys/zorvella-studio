import { useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";

import { PageHeading, Storefront } from "@/components/storefront";
import { supabase } from "@/integrations/supabase/client";

const INQUIRY_TOPICS = [
  "Routine & Layering Guidance",
  "Sensitive Skin Compatibility",
  "Order & Delivery Care",
  "Ingredient & Batch Question",
];

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Customer Care — ZORVELLAE" },
      { name: "description", content: "Connect with the ZORVELLAE formulation concierge and customer care atelier." },
      { property: "og:title", content: "Contact ZORVELLAE" },
      { property: "og:description", content: "Get in touch with ZORVELLAE customer care." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData({
      queryKey: ["store", "public-contact"],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("store_settings")
          .select("setting_value")
          .eq("setting_key", "public.contact")
          .maybeSingle();
        if (error) throw error;
        return data?.setting_value ?? null;
      },
    }),
  component: ContactPage,
});

function ContactPage() {
  const { data: contactDetails } = useSuspenseQuery({
    queryKey: ["store", "public-contact"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_settings")
        .select("setting_value")
        .eq("setting_key", "public.contact")
        .maybeSingle();
      if (error) throw error;
      return data?.setting_value ?? null;
    },
  });

  const contact = contactDetails && typeof contactDetails === "object" && !Array.isArray(contactDetails) ? contactDetails : null;
  const emailAddress = contact && typeof contact["email"] === "string" ? contact["email"] : "care@zorvellae.com";
  const phoneValue = contact && typeof contact["phone"] === "string" ? contact["phone"] : "+1 (800) 555-0194";

  const [subject, setSubject] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const name = String(values.get("name") ?? "").trim();
    const email = String(values.get("email") ?? "").trim();
    const subjectValue = String(values.get("subject") ?? "").trim();
    const message = String(values.get("message") ?? "").trim();

    if (
      name.length < 2 ||
      name.length > 120 ||
      !email ||
      email.length > 254 ||
      subjectValue.length < 3 ||
      subjectValue.length > 200 ||
      message.length < 5 ||
      message.length > 2000
    ) {
      return setError("Please complete each field within the stated limits.");
    }

    setSubmitting(true);
    setError("");
    const { error: submitError } = await supabase
      .from("contact_messages")
      .insert({ name, email, subject: subjectValue, message });
    setSubmitting(false);

    if (submitError) {
      setError("Your message could not be sent just now. Please try again.");
      return;
    }

    toast.success("Your message was received.");
    await navigate({ to: "/contact/thank-you" });
  }

  return (
    <Storefront>
      <section className="catalog-banner">
        <PageHeading
          eyebrow="Client Concierge · Here to Help"
          title={
            <>
              Unhurried guidance for <em>your skin.</em>
            </>
          }
          description="Write to our formulation specialists for routine pairing suggestions, ingredient clarity, or assistance with an existing ZORVELLAE order."
          imageSrc="/site-assets/generated/editorial_about_atelier_1795670128506.jpg"
          imageAlt="Inside the sunlit ZORVELLAE apothecary studio"
        />
      </section>

      <section className="concerns-workspace-section">
        <div className="contact-atelier-grid">
          <aside className="contact-atelier-aside">
            <div className="contact-info-card">
              <span className="section-kicker">Direct Channels</span>
              <h2>Speak with the atelier.</h2>
              <p>Our formulation advisors respond within one business day across all inquiries.</p>

              <ul className="contact-channel-list">
                <li>
                  <Mail size={15} aria-hidden="true" />
                  <div>
                    <span>Email Concierge</span>
                    <a href={`mailto:${emailAddress}`}>{emailAddress}</a>
                  </div>
                </li>
                <li>
                  <Phone size={15} aria-hidden="true" />
                  <div>
                    <span>Client Desk</span>
                    <a href={`tel:${phoneValue}`}>{phoneValue}</a>
                  </div>
                </li>
                <li>
                  <Clock size={15} aria-hidden="true" />
                  <div>
                    <span>Atelier Hours</span>
                    <strong>Monday – Friday, 9:00 AM – 6:00 PM EST</strong>
                  </div>
                </li>
                <li>
                  <MapPin size={15} aria-hidden="true" />
                  <div>
                    <span>Laboratories</span>
                    <strong>ZORVELLAE Laboratories Inc.</strong>
                  </div>
                </li>
              </ul>
            </div>

            <div className="contact-info-card">
              <span className="section-kicker">Quick Links</span>
              <div className="contact-quick-links">
                <Link to="/skin-concerns">Explore Skin Concerns Index</Link>
                <Link to="/routines">Compare AM / PM Routines</Link>
                <Link to="/ingredients">Read Ingredient Monographs</Link>
              </div>
            </div>
          </aside>

          <div className="contact-form-card">
            <span className="section-kicker">Send an Inquiry</span>
            <h2>How may we assist?</h2>

            <div className="contact-topic-row" role="group" aria-label="Quick topic suggestions">
              {INQUIRY_TOPICS.map((topic) => (
                <button
                  key={topic}
                  type="button"
                  className={`concern-tab-button ${subject === topic ? "is-active" : ""}`}
                  onClick={() => setSubject(topic)}
                >
                  {topic}
                </button>
              ))}
            </div>

            <form className="contact-form-editorial" onSubmit={submit}>
              <div className="contact-form-grid">
                <label className="contact-form-field">
                  <span>Your name</span>
                  <input className="store-field" name="name" autoComplete="name" minLength={2} maxLength={120} required />
                </label>
                <label className="contact-form-field">
                  <span>Email address</span>
                  <input className="store-field" name="email" type="email" autoComplete="email" maxLength={254} required />
                </label>
                <label className="contact-form-field">
                  <span>Subject</span>
                  <input
                    className="store-field"
                    name="subject"
                    value={subject}
                    onChange={(event) => setSubject(event.target.value)}
                    minLength={3}
                    maxLength={200}
                    required
                  />
                </label>
                <label className="contact-form-field">
                  <span>Your message</span>
                  <textarea className="store-field store-textarea" name="message" minLength={5} maxLength={2000} required />
                </label>
              </div>
              <button className="store-link address-form-submit" type="submit" disabled={submitting}>
                {submitting ? "Sending…" : "Send a message"}
              </button>
              {error && (
                <p className="auth-error" role="alert">
                  {error}
                </p>
              )}
            </form>
          </div>
        </div>
      </section>
    </Storefront>
  );
}
