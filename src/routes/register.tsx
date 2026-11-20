import { useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

import { SignInOptions, startSocialSignIn, Storefront } from "@/components/storefront";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [
    { title: "Create a Customer Account — ZORVELLAE" },
    { name: "description", content: "Create a secure ZORVELLAE customer account for saved addresses and order history." },
    { property: "og:title", content: "Create a Customer Account — ZORVELLAE" },
    { property: "og:description", content: "Create a customer account with ZORVELLAE." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const fullName = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    if (fullName.length < 2) return setError("Enter the name you would like on your account.");
    if (password.length < 8) return setError("Choose a password with at least 8 characters.");
    setLoading(true);
    setError("");
    setNotice("");
    const { data, error: authError } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } });
    setLoading(false);
    if (authError) return setError(authError.message.includes("already registered") ? "An account already exists with that email. Sign in instead." : "We could not create that account. Please review your details and try again.");
    if (data.session) { await navigate({ to: "/account" }); return; }
    setNotice("Your account is almost ready. Check your email for a confirmation link, then sign in.");
  }
  return <Storefront><section className="auth-layout"><aside className="auth-editorial"><span className="eyebrow">A space of your own</span><h1>A more considered ritual starts here.</h1><p>Create an account to keep your saved formulations, delivery details, and order history close at hand.</p><span className="auth-editorial-image"><img src="/site-assets/zorvellae-hero.webp" alt="Softly lit botanical ZORVELLAE brand photography." /></span></aside><div className="auth-form-panel"><h2>Create an account</h2><form className="auth-form" onSubmit={onSubmit}><label className="address-form-field"><span className="field-label">Your name</span><input className="store-field" name="name" autoComplete="name" minLength={2} maxLength={80} required /></label><label className="address-form-field"><span className="field-label">Email address</span><input className="store-field" name="email" type="email" autoComplete="email" maxLength={254} required /></label><label className="address-form-field"><span className="field-label">Password</span><input className="store-field" name="password" type="password" autoComplete="new-password" minLength={8} required /><span className="field-label">At least 8 characters</span></label><button className="store-link auth-submit" type="submit" disabled={loading}>{loading ? "Creating your account…" : "Create a secure account"}</button></form>{error && <p className="auth-error" role="alert">{error}</p>}{notice && <p className="account-lead" role="status">{notice}</p>}<div className="auth-divider">or continue with</div><SignInOptions loading={loading} onGoogle={() => void startSocialSignIn("google").catch(() => setError("Google sign-in could not be started. Please try again."))} onLovable={() => void startSocialSignIn("lovable").catch(() => setError("Lovable sign-in could not be started. Please try again."))} /><p className="auth-alternate">Already have an account? <Link to="/login">Sign in</Link></p></div></section></Storefront>;
}