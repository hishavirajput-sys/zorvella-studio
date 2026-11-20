import { createFileRoute, Link, Outlet, redirect, useLocation } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Storefront } from "@/components/storefront";
import { AdminGate } from "@/components/admin";

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
  return <Storefront><section className="admin-layout"><span className="eyebrow">ZORVELLAE · Store studio</span><div className="admin-toolbar"><h1>Thoughtful store management.</h1></div><nav className="admin-nav" aria-label="Store administration">{navigation.map(({ path, label }) => <Link to={path} key={path} aria-current={location.pathname === path ? "page" : undefined}>{label}</Link>)}</nav><AdminGate><Outlet /></AdminGate></section></Storefront>;
}
