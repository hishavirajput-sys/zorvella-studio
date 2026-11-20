import { createFileRoute, Link, Outlet, redirect, useLocation } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ShieldAlert } from "lucide-react";

import { Storefront } from "@/components/storefront";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (!data.user || error) throw redirect({ to: "/login" });
    const { data: roles, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id)
      .eq("role", "admin");
    if (roleError || roles.length === 0) throw redirect({ to: "/account" });
  },
  head: () => ({ meta: [
    { title: "Store Studio — ZORVELLAE" },
    { name: "description", content: "Manage published ZORVELLAE products, categories and store content." },
    { property: "og:title", content: "Store Studio — ZORVELLAE" },
    { property: "og:description", content: "Secure store management for ZORVELLAE." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: AdminLayout,
});

const navigation = [
  { path: "/admin", label: "Overview" },
  { path: "/admin/products", label: "Products" },
  { path: "/admin/categories", label: "Categories" },
  { path: "/admin/orders", label: "Orders" },
  { path: "/admin/inventory", label: "Inventory" },
  { path: "/admin/ingredients", label: "Ingredients" },
  { path: "/admin/content", label: "Content" },
  { path: "/admin/customers", label: "Customers" },
  { path: "/admin/contact-messages", label: "Messages" },
  { path: "/admin/settings", label: "Settings" },
] as const;

export function AdminLayout() {
  const location = useLocation();
  return <Storefront><section className="admin-layout"><span className="eyebrow">ZORVELLAE · Store studio</span><div className="admin-toolbar"><h1>Thoughtful store management.</h1></div><nav className="admin-nav" aria-label="Store administration">{navigation.map(({ path, label }) => <Link to={path} key={path} aria-current={location.pathname === path ? "page" : undefined}>{label}</Link>)}</nav><Outlet /></section></Storefront>;
}

export function AdminGate({ children }: { children: React.ReactNode }) {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  useEffect(() => {
    let active = true;
    void supabase.auth.getUser().then(async ({ data, error }) => {
      if (!data.user || error) {
        if (active) setAllowed(false);
        return;
      }
      const { data: role, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (active) setAllowed(Boolean(role) && !roleError);
    });
    return () => { active = false; };
  }, []);
  if (allowed === null) return <p className="loading-note" role="status">Checking store access…</p>;
  if (!allowed) return <div className="admin-denied"><ShieldAlert size={28} aria-hidden="true" /><h2>Store management is restricted.</h2><p>This account does not have permission to manage the store.</p><Link to="/" className="store-link">Return to the shop</Link></div>;
  return children;
}