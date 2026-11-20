import { useState, type FormEvent, type ReactNode } from "react";
import { createFileRoute, Link, Outlet, redirect, useLocation, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Storefront } from "@/components/storefront";
import { supabase } from "@/integrations/supabase/client";
import { getSignedInUser, saveCustomerAddress } from "@/lib/store-data";

export const Route = createFileRoute("/account")({
  beforeLoad: async () => {
    const user = await getSignedInUser();
    if (!user) throw redirect({ to: "/login" });
    return { customerName: typeof user.user_metadata.full_name === "string" ? user.user_metadata.full_name : user.email ?? "Customer", customerEmail: user.email ?? "" };
  },
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
  const { customerName } = Route.useRouteContext();
  const nav = [{ path: "/account", label: "Overview" }, { path: "/account/profile", label: "Profile" }, { path: "/account/addresses", label: "Addresses" }, { path: "/account/orders", label: "Orders" }] as const;
  return <Storefront><div className="account-layout"><nav className="account-aside" aria-label="Customer account"><span className="eyebrow">Your account</span>{nav.map(({ path, label }) => <Link key={path} to={path} aria-current={location.pathname === path ? "page" : undefined}>{label}</Link>)}<Button variant="ghost" size="sm" className="account-signout" onClick={async () => { await supabase.auth.signOut(); toast.success("You are signed out."); await navigate({ to: "/" }); }}>Sign out</Button></nav><section className="account-panel"><Outlet />{location.pathname === "/account" && <><span className="eyebrow">Your ZORVELLAE space</span><h1>Welcome, {customerName}.</h1><p className="account-lead">Your formulations, saved details and recent orders, together in one place.</p><div className="account-data-row"><span><strong>Your personal details</strong><small>Review your account name and email</small></span><Link className="text-link" to="/account/profile">Profile details</Link></div><div className="account-data-row"><span><strong>Saved delivery details</strong><small>Manage the addresses you use for your orders</small></span><Link className="text-link" to="/account/addresses">Your addresses</Link></div><div className="account-data-row"><span><strong>Order history</strong><small>Keep track of your purchased formulations</small></span><Link className="text-link" to="/account/orders">View orders</Link></div></>}</section></div></Storefront>;
}

function PageTitle({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) { return <><h1>{title}</h1>{eyebrow && <p className="account-lead">{eyebrow}</p>}{children}</>; }

export function AccountProfilePage() {
  const { customerName, customerEmail } = Route.useRouteContext();
  return <><PageTitle title="Your profile" eyebrow="Account details" /><div className="account-data-row"><span><strong>Name</strong><small>{customerName}</small></span></div><div className="account-data-row"><span><strong>Email address</strong><small>{customerEmail}</small></span></div><p className="account-lead">Your customer profile is linked to your verified login. Sign in with another email to change accounts.</p></>;
}

export function AccountAddressesPage() {
  const query = useSuspenseQuery({ queryKey: ["account", "addresses"], queryFn: async () => {
    const user = await getSignedInUser();
    if (!user) return [];
    const { data, error } = await supabase.from("customer_addresses").select("*").eq("user_id", user.id).order("is_default", { ascending: false }).order("created_at");
    if (error) throw error;
    return data;
  } });
  const { data: addresses, refetch } = query;
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const first_name = String(values.first_name ?? "").trim();
    const last_name = String(values.last_name ?? "").trim();
    const address_line_1 = String(values.address_line_1 ?? "").trim();
    const address_line_2 = String(values.address_line_2 ?? "").trim();
    const city = String(values.city ?? "").trim();
    const region = String(values.region ?? "").trim();
    const postal_code = String(values.postal_code ?? "").trim();
    const country = String(values.country ?? "").trim();
    if ([first_name, last_name, address_line_1, city, region, postal_code, country].some((value) => !value)) return setError("Fill in the required delivery details.");
    setLoading(true);
    setError("");
    try {
      await saveCustomerAddress({ first_name, last_name, address_line_1, address_line_2, city, region, postal_code, country });
      await refetch();
      event.currentTarget.reset();
      toast.success("Your delivery address has been saved.");
    } catch {
      setError("Your address could not be saved. Please check the details and try again.");
    }
    setLoading(false);
  }
  async function remove(id: string) {
    try {
      const user = await getSignedInUser();
      if (!user) return;
      const { error: deletionError } = await supabase.from("customer_addresses").delete().eq("id", id).eq("user_id", user.id);
      if (deletionError) throw deletionError;
      await refetch();
      toast.success("The saved address has been removed.");
    } catch {
      toast.error("That address could not be removed. Please try again.");
    }
  }
  return <><PageTitle title="Saved addresses" eyebrow="Private to your account." />{addresses.length === 0 ? <p className="account-lead">No saved addresses yet.</p> : <div className="address-list">{addresses.map((address) => <div className="address-card" key={address.id}><p><strong>{address.first_name} {address.last_name}</strong>{address.address_line_2 && <><br />{address.address_line_2}</>}<br />{address.address_line_1}<br />{address.city}, {address.region} {address.postal_code}<br />{address.country}</p><Button variant="ghost" size="sm" onClick={() => void remove(address.id)} aria-label="Remove saved address">Remove</Button></div>)}</div>}<form className="address-form" onSubmit={submit}><strong>Add a delivery address</strong><div className="address-form-grid" style={{ marginTop: "13px" }}>{[{ id: "first_name", label: "First name" }, { id: "last_name", label: "Last name" }, { id: "address_line_1", label: "Address" }, { id: "address_line_2", label: "Address line 2", required: false }, { id: "city", label: "City" }, { id: "region", label: "State / Region" }, { id: "postal_code", label: "Postal code" }, { id: "country", label: "Country" }].map((field) => <label className={`address-form-field ${field.id.startsWith("address_line") ? "form-span-two" : ""}`} key={field.id} htmlFor={field.id}><span>{field.label}</span><input id={field.id} className="store-field" name={field.id} autoComplete={field.id} required={field.required !== false} maxLength={field.id.startsWith("address_line") ? 120 : 80} /></label>)}</div><Button type="submit" className="store-link address-form-submit" disabled={loading}>{loading ? "Saving…" : "Save address"}</Button>{error && <p className="auth-error" role="alert">{error}</p>}</form></>;
}

export function AccountOrdersPage() {
  const { data: orders, error } = useSuspenseQuery({ queryKey: ["account", "orders"], queryFn: async () => {
    const user = await getSignedInUser();
    if (!user) return [];
    const { data, error: ordersError } = await supabase.from("orders").select("id, reference, status, currency, subtotal, created_at").eq("user_id", user.id).order("created_at", { ascending: false });
    if (ordersError) throw ordersError;
    return data;
  } });
  return <><PageTitle title="Order history" eyebrow="Order records connected to your account." />{error ? <p className="auth-error" role="alert">Your orders could not be loaded.</p> : orders.length === 0 ? <p className="account-lead">No order history is available yet.</p> : <div className="order-list">{orders.map((order) => <Link to="/account/orders/$orderId" params={{ orderId: order.id }} key={order.id}><span>{order.reference}<br /><small>{new Date(order.created_at).toLocaleDateString()}</small></span><span>{order.status} · {new Intl.NumberFormat("en-US", { style: "currency", currency: order.currency.trim() }).format(order.subtotal)}</span></Link>)}</div>}</>;
}