import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";

import { getSignedInUser } from "@/lib/store-data";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

type OrderItem = { productName: string; variantLabel: string; quantity: number; unitPrice: number; lineTotal: number };

export const Route = createFileRoute("/_authenticated/account/orders/$orderId")({
  head: () => ({ meta: [
    { title: "Order Details — ZORVELLAE" },
    { name: "description", content: "Review your order status and purchased formulation details." },
    { property: "og:title", content: "Order Details — ZORVELLAE" },
    { property: "og:description", content: "Your private ZORVELLAE order details." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  loader: async ({ context, params }) => {
    return context.queryClient.ensureQueryData({ queryKey: ["account", "order", params.orderId], queryFn: async () => {
      const user = await getSignedInUser();
      if (!user) throw notFound();
      const { data, error } = await supabase.from("orders").select("*").eq("id", params.orderId).eq("user_id", user.id).maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      return data;
    } });
  },
  component: OrderDetailPage,
});

function getOrderItems(value: Json): OrderItem[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (typeof entry !== "object" || entry === null || Array.isArray(entry)) return [];
    if (typeof entry.productName !== "string" || typeof entry.variantLabel !== "string" || typeof entry.quantity !== "number" || typeof entry.unitPrice !== "number" || typeof entry.lineTotal !== "number") return [];
    return [{ productName: entry.productName, variantLabel: entry.variantLabel, quantity: entry.quantity, unitPrice: entry.unitPrice, lineTotal: entry.lineTotal }];
  });
}

function OrderDetailPage() {
  const { orderId } = Route.useParams();
  const { data: order } = useSuspenseQuery({ queryKey: ["account", "order", orderId], queryFn: async () => {
    const user = await getSignedInUser();
    if (!user) throw notFound();
    const { data, error } = await supabase.from("orders").select("*").eq("id", orderId).eq("user_id", user.id).maybeSingle();
    if (error) throw error;
    if (!data) throw notFound();
    return data;
  } });
  const items = getOrderItems(order.items);
  const amount = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: order.currency.trim() }).format(value);
  return <><Link className="text-link order-return" to="/account/orders"><ArrowLeft size={14} /> All orders</Link><span className="eyebrow">Your order</span><h1>{order.reference}</h1><p className="account-lead">{order.status} · {new Date(order.created_at).toLocaleDateString()}</p><div className="address-list">{items.map((item, index) => <div className="account-data-row" key={`${item.productName}-${index}`}><span><strong>{item.productName}</strong><small>{item.variantLabel} · {item.quantity} item{item.quantity === 1 ? "" : "s"}</small></span><span>{amount(item.lineTotal)}</span></div>)}</div><div className="account-data-row"><span><strong>Subtotal</strong><small>Shipping and taxes were not calculated</small></span><strong>{amount(order.subtotal)}</strong></div><p className="account-lead">Shipping rates and tax details are not calculated. No payment has been taken by this preview.</p></>;
}