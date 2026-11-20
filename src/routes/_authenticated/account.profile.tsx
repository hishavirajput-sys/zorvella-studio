import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { customerProfileMetadata } from "@/lib/store-domain";

export const Route = createFileRoute("/_authenticated/account/profile")({
  head: () => ({ meta: [
    { title: "Profile Details — ZORVELLAE" },
    { name: "description", content: "Review the name and email linked to your secure ZORVELLAE customer account." },
    { property: "og:title", content: "Profile Details — ZORVELLAE" },
    { property: "og:description", content: "Your ZORVELLAE account details." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: ProfilePage,
});

function ProfilePage() {
  const [profile, setProfile] = useState({ name: "", email: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => setProfile({ name: typeof data.user?.user_metadata["full_name"] === "string" ? data.user.user_metadata["full_name"] : "", email: data.user?.email ?? "" }));
  }, []);

  async function saveName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = profile.name.trim();
    if (!name) {
      setError("Enter your name to save your profile.");
      return;
    }
    setLoading(true);
    setError("");
    const { error: updateError } = await supabase.auth.updateUser({ data: customerProfileMetadata(name) });
    setLoading(false);
    if (updateError) {
      setError("Your name could not be saved. Please try again.");
      return;
    }
    setProfile((current) => ({ ...current, name }));
    toast.success("Your name has been saved.");
  }

  return <><h1>Your profile</h1><p className="account-lead">Your name is the only profile detail stored here.</p><form className="address-form" onSubmit={saveName}><label className="address-form-field" htmlFor="profile-name"><span>Name</span><input id="profile-name" className="store-field" name="name" autoComplete="name" maxLength={120} value={profile.name} onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))} required /></label><Button type="submit" className="store-link address-form-submit" disabled={loading}>{loading ? "Saving…" : "Save name"}</Button>{error && <p className="auth-error" role="alert">{error}</p>}</form><div className="account-data-row"><span><strong>Email address</strong><small>{profile.email}</small></span></div><p className="account-lead">Your email stays with your login and cannot be changed here.</p></>;
}