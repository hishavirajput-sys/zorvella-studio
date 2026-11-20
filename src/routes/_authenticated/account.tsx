import { useEffect, useState } from "react";
import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Storefront } from "@/components/storefront";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({ meta: [
    { title: "Your Account — ZORVELLAE" },
    { name: "description", content: "Manage your ZORVELLAE customer profile, saved delivery addresses and order history." },
    { property: "og:title", content: "Your Account — ZORVELLAE" },
    { property: "og:description", content: "Your personal space with ZORVELLAE." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: AccountLayout,
});

function AccountLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [customerName, setCustomerName] = useState("Customer");
  const nav = [{ path: "/account", label: "Overview" }, { path: "/account/profile", label: "Profile" }, { path: "/account/addresses", label: "Addresses" }, { path: "/account/orders", label: "Orders" }] as const;
  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => setCustomerName(typeof data.user?.user_metadata["full_name"] === "string" ? data.user.user_metadata["full_name"] : data.user?.email ?? "Customer"));
  }, []);
  return <Storefront><div className="account-layout"><nav className="account-aside" aria-label="Customer account"><span className="eyebrow">Your account</span>{nav.map(({ path, label }) => <Link key={path} to={path as "/account" | "/account/profile" | "/account/addresses" | "/account/orders"} aria-current={location.pathname === path ? "page" : undefined}>{label}</Link>)}<Button variant="ghost" size="sm" className="account-signout" onClick={async () => { await supabase.auth.signOut(); toast.success("You are signed out."); await navigate({ to: "/" }); }}>Sign out</Button></nav><section className="account-panel">{location.pathname === "/account" ? <><span className="eyebrow">Your ZORVELLAE space</span><h1>Welcome, {customerName}.</h1><p className="account-lead">Your formulations, saved details and recent orders, together in one place.</p><div className="account-data-row"><span><strong>Your personal details</strong><small>Review your account name and email</small></span><Link className="text-link" to="/account/profile">Profile details</Link></div><div className="account-data-row"><span><strong>Saved delivery details</strong><small>Manage the addresses you use for your orders</small></span><Link className="text-link" to="/account/addresses">Your addresses</Link></div><div className="account-data-row"><span><strong>Order history</strong><small>Keep track of your purchased formulations</small></span><Link className="text-link" to="/account/orders">View orders</Link></div></> : <Outlet />}</section></div></Storefront>;
}