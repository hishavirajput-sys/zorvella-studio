import { Link, createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { customerOrdersQueryOptions } from "@/lib/store-data";

export const Route = createFileRoute("/_authenticated/account/orders")({
  head: () => ({ meta: [
    { title: "Order History — ZORVELLAE" },
    { name: "description", content: "View order records associated with your ZORVELLAE customer account." },
    { property: "og:title", content: "Order History — ZORVELLAE" },
    { property: "og:description", content: "Private order history for your ZORVELLAE account." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(customerOrdersQueryOptions),
  component: OrdersPage,
});

function OrdersPage() {
  const { data: orders } = useSuspenseQuery(customerOrdersQueryOptions);
  return <><h1>Order history</h1><p className="account-lead">Order records connected to your account.</p>{!orders?.length ? <p className="account-lead">No order history is available yet.</p> : <div className="order-list">{orders.map((order) => <Link to="/account/orders/$orderId" params={{ orderId: order.id }} key={order.id}><span>{order.reference}<br /><small>{new Date(order.created_at).toLocaleDateString()}</small></span><span>{order.status} · {new Intl.NumberFormat("en-US", { style: "currency", currency: order.currency.trim() }).format(order.subtotal)}</span></Link>)}</div>}</>;
}