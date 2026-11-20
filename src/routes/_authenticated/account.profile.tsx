import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";

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
  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => setProfile({ name: typeof data.user?.user_metadata.full_name === "string" ? data.user.user_metadata.full_name : "Customer", email: data.user?.email ?? "" }));
  }, []);
  return <><h1>Your profile</h1><p className="account-lead">Customer account details.</p><div className="account-data-row"><span><strong>Name</strong><small>{profile.name}</small></span></div><div className="account-data-row"><span><strong>Email address</strong><small>{profile.email}</small></span></div><p className="account-lead">Your customer profile is linked to your verified login. Sign in with another email to change accounts.</p></>;
}