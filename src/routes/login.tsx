import { useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { toast } from "sonner";

import { SignInOptions, startSocialSignIn, Storefront } from "@/components/storefront";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [
    { title: "Sign In — ZORVELLAE" },
    { name: "description", content: "Sign in to your ZORVELLAE customer account." },
    { property: "og:title", content: "Sign In — ZORVELLAE" },
    { property: "og:description", content: "Return to your ZORVELLAE customer account." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    if (!email || !password) return setError("Enter your email address and password.");
    setLoading(true);
    setError("");
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (authError) {
      setError(authError.message.includes("Email not confirmed") ? "Check your email to confirm your account before signing in." : "That email and password did not match. Please try again.");
      return;
    }
    await router.invalidate();
    toast.success("Welcome back.");
    await navigate({ to: "/account" });
  }

  return <Storefront><section className="auth-layout"><aside className="auth-editorial"><span className="eyebrow">Your ZORVELLAE space</span><h1>Welcome back to your ritual.</h1><p>Find your saved formulations, shipping details and order history in one quiet space.</p><span className="auth-editorial-image"><img src="/site-assets/home/science-editorial.webp" alt="Illustrative skincare science photography." /></span></aside><div className="auth-form-panel"><h2>Sign in</h2><form className="auth-form" onSubmit={onSubmit}><label className="address-form-field"><span className="field-label">Email address</span><input className="store-field" name="email" type="email" autoComplete="email" required /></label><label className="address-form-field"><span className="field-label">Password</span><input className="store-field" name="password" type="password" autoComplete="current-password" required /></label><button className="store-link auth-submit" type="submit" disabled={loading}>{loading ? "Signing in…" : "Sign in to your account"}</button></form>{error && <p className="auth-error" role="alert">{error}</p>}<div className="auth-divider">or continue with</div><SignInOptions loading={loading} onGoogle={() => void startSocialSignIn("google").catch(() => setError("Google sign-in could not be started. Please try again."))} onLovable={() => void startSocialSignIn("lovable").catch(() => setError("Lovable sign-in could not be started. Please try again."))} /><p className="auth-alternate">New to ZORVELLAE? <Link to="/register">Create an account</Link></p></div></section></Storefront>;
}