import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, ShoppingBag } from "lucide-react";

import { PageHeading, QuantityStepper, Storefront, calculateCartSubtotal, formatPrice, isPurchasableProduct, useStoreCart } from "@/components/storefront";
import { Button } from "@/components/ui/button";
import { catalogQueryOptions } from "@/lib/store-data";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [
    { title: "Your Bag — ZORVELLAE" },
    { name: "description", content: "Review the formulations saved in your ZORVELLAE bag." },
    { property: "og:title", content: "Your Bag — ZORVELLAE" },
    { property: "og:description", content: "Review your ZORVELLAE formulations." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogQueryOptions()),
  component: CartPage,
});

function CartPage() {
  const cart = useStoreCart();
  const { data: products } = useSuspenseQuery(catalogQueryOptions());
  const validItems = cart.items.filter((item) => {
    const product = products.find((entry) => entry.id === item.productId);
    return product && isPurchasableProduct(product) && Array.isArray(product.variants) && product.variants.some((variant) => variant && typeof variant === "object" && !Array.isArray(variant) && variant["id"] === item.variantId);
  });
  const subtotal = calculateCartSubtotal(validItems, products);
  const currency = products.find((product) => validItems.some((item) => item.productId === product.id))?.currency ?? "USD";
  return (
    <Storefront>
      <section className="cart-content">
        <PageHeading eyebrow="A considered collection" title="Your formulation bag" description={cart.loaded ? `${validItems.reduce((total, item) => total + item.quantity, 0)} ${validItems.reduce((total, item) => total + item.quantity, 0) === 1 ? "item" : "items"} in your bag` : "Preparing your bag…"} />
        {validItems.length === 0 ? <div className="empty-bag"><ShoppingBag aria-hidden="true" /><h2>Your bag is taking shape.</h2><p>There are no purchasable formulations in your bag. Development samples are not available for purchase.</p><Link to="/shop" className="store-link">Discover the collection <ArrowRight size={14} /></Link></div> : <>
          <div className="cart-list">{validItems.map((item) => {
            const product = products.find((entry) => entry.id === item.productId);
            if (!product) return null;
            const variant = Array.isArray(product.variants) ? product.variants.find((entry) => entry && typeof entry === "object" && !Array.isArray(entry) && entry["id"] === item.variantId) : null;
            const variantLabel = variant && typeof variant === "object" && !Array.isArray(variant) && typeof variant["label"] === "string" ? variant["label"] : "Formulation";
            const unitPrice = variant && typeof variant === "object" && !Array.isArray(variant) && typeof variant["price"] === "number" ? variant["price"] : 0;
            const firstImage = Array.isArray(product.images) ? product.images[0] : undefined;
            const image = firstImage && typeof firstImage === "object" && !Array.isArray(firstImage) ? firstImage["url"] : null;
            return <article className="cart-item" key={`${item.productId}-${item.variantId}`}><div className="cart-item-image">{typeof image === "string" && <img src={image} alt="" />}</div><div className="cart-item-copy"><span className="eyebrow">{product.category_label || "Formulation"}</span><Link className="cart-product-name" to="/product/$slug" params={{ slug: product.slug }}>{product.name}</Link><p className="cart-variant">{variantLabel} · {formatPrice(unitPrice, product.currency)}</p><div className="cart-item-actions"><QuantityStepper quantity={item.quantity} onChange={(quantity) => void cart.changeQuantity(item.productId, item.variantId, quantity)} /><Button variant="ghost" size="sm" className="cart-remove" onClick={() => void cart.removeItem(item.productId, item.variantId)}>Remove</Button></div></div><div className="cart-item-total">{formatPrice(unitPrice * item.quantity, product.currency)}</div></article>;
          })}</div>
          <div className="cart-summary"><div className="cart-summary-row"><span>Subtotal</span><span>{formatPrice(subtotal, currency)}</span></div><p className="cart-summary-note">Shipping and taxes are not calculated here. Checkout will open once the real product catalogue, shipping and payment arrangements are configured.</p><Button type="button" className="store-link cart-checkout" disabled>Checkout is not yet available</Button><Link to="/shop" className="secondary-cart-link text-link">Continue discovering <ArrowRight size={13} /></Link></div>
        </>}
      </section>
    </Storefront>
  );
}