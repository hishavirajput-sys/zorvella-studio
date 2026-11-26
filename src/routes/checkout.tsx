import { useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import {
  PageHeading,
  Storefront,
  calculateCartSubtotal,
  formatPrice,
  isPurchasableProduct,
  useStoreCart,
} from "@/components/storefront";
import { supabase } from "@/integrations/supabase/client";
import { catalogQueryOptions, getSignedInUser } from "@/lib/store-data";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — ZORVELLAE" },
      { name: "description", content: "Complete your ZORVELLAE formulation order with itemized ritual verification." },
      { property: "og:title", content: "Checkout — ZORVELLAE" },
      { property: "og:description", content: "ZORVELLAE checkout and dispatch confirmation." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogQueryOptions()),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { items, clearCart } = useStoreCart();
  const { data: products } = useSuspenseQuery(catalogQueryOptions());
  const [submitting, setSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<{ reference: string; total: number; currency: string; email: string } | null>(null);
  const [error, setError] = useState("");

  const validItems = items.filter((item) => {
    const product = products.find((entry) => entry.id === item.productId);
    return (
      product &&
      isPurchasableProduct(product) &&
      Array.isArray(product.variants) &&
      product.variants.some((variant) => variant && typeof variant === "object" && !Array.isArray(variant) && variant["id"] === item.variantId)
    );
  });

  const subtotal = calculateCartSubtotal(validItems, products);
  const shipping = subtotal >= 75 || subtotal === 0 ? 0 : 9;
  const total = subtotal + shipping;
  const currency = products.find((product) => validItems.some((item) => item.productId === product.id))?.currency ?? "USD";

  async function handlePlaceOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (validItems.length === 0) return;

    const form = new FormData(event.currentTarget);
    const fullName = String(form.get("fullName") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const phone = String(form.get("phone") ?? "").trim();
    const addressLine1 = String(form.get("address") ?? "").trim();
    const city = String(form.get("city") ?? "").trim();
    const postalCode = String(form.get("postalCode") ?? "").trim();

    if (fullName.length < 2 || !email.includes("@") || addressLine1.length < 4 || city.length < 2 || postalCode.length < 3) {
      setError("Please provide your full name, valid email, delivery address, city, and postal code.");
      return;
    }

    setSubmitting(true);
    setError("");

    const user = await getSignedInUser().catch(() => null);
    const reference = `ZRV-${Math.floor(10000 + Math.random() * 89999)}`;
    const lineItems = validItems.map((item) => {
      const product = products.find((entry) => entry.id === item.productId);
      const variants = Array.isArray(product?.variants) ? product.variants : [];
      const variant = variants.find((v) => v && typeof v === "object" && !Array.isArray(v) && v["id"] === item.variantId);
      const unitPrice = variant && typeof variant === "object" && !Array.isArray(variant) && typeof variant["price"] === "number" ? variant["price"] : 0;
      const variantLabel = variant && typeof variant === "object" && !Array.isArray(variant) && typeof variant["label"] === "string" ? variant["label"] : item.variantId;
      return {
        productId: item.productId,
        name: product?.name ?? "Formulation",
        variantLabel,
        quantity: item.quantity,
        unitPrice,
      };
    });

    const { error: insertError } = await supabase.from("orders").insert({
      reference,
      status: "processing",
      currency,
      subtotal: total,
      user_id: user?.id ?? "guest",
      contact_email: email,
      shipping_status: "preparing",
      items: lineItems as never,
      shipping_address: {
        fullName,
        phone,
        addressLine1,
        city,
        postalCode,
      } as never,
      status_history: [
        {
          status: "processing",
          note: "Order confirmed for studio dispatch",
          at: new Date().toISOString(),
        },
      ] as never,
    });

    setSubmitting(false);

    if (insertError) {
      setError("Your dispatch request could not be recorded. Please review your details and try again.");
      return;
    }

    await clearCart();
    setConfirmedOrder({ reference, total, currency, email });
    toast.success(`Order ${reference} confirmed.`);
  }

  return (
    <Storefront>
      <section className="catalog-banner">
        <PageHeading
          eyebrow="Atelier Dispatch · Order Verification"
          title={
            confirmedOrder ? (
              <>
                Order confirmed: <em>{confirmedOrder.reference}</em>
              </>
            ) : (
              <>
                Complete your <em>dispatch.</em>
              </>
            )
          }
          description={
            confirmedOrder
              ? "Preparing climate-controlled shipment from ZORVELLAE Laboratories."
              : `${validItems.reduce((count, item) => count + item.quantity, 0)} formulations prepared for climate-controlled studio delivery.`
          }
          imageSrc="/site-assets/generated/product_rosehip_cream_1795670125752.jpg"
          imageAlt="ZORVELLAE restorative moisturizer jar prepared for dispatch"
        />
      </section>

      <section className="concerns-workspace-section">
        <div className="routine-builder-inner">
          {confirmedOrder ? (
            <div className="checkout-receipt-card">
              <CheckCircle2 size={28} aria-hidden="true" />
              <span className="section-kicker">Order #{confirmedOrder.reference} Confirmed — Preparing Shipment</span>
              <h2>Thank you for assembling your daily ritual.</h2>
              <p>
                A dispatch record for <strong>{formatPrice(confirmedOrder.total, confirmedOrder.currency)}</strong> has been logged for{" "}
                <strong>{confirmedOrder.email}</strong>. You can review order status inside your account or Store Studio.
              </p>
              <div className="home-cta-row">
                <Link className="store-link" to="/shop">
                  Return to catalog
                </Link>
                <Link className="store-link store-link-outline" to="/routines">
                  View AM / PM usage guide
                </Link>
              </div>
            </div>
          ) : validItems.length === 0 ? (
            <div className="empty-bag">
              <h2>Your formulation bag is empty.</h2>
              <p>Add ZORVELLAE formulations from the shop before proceeding to dispatch verification.</p>
              <Link className="store-link" to="/shop">
                Explore formulations
              </Link>
            </div>
          ) : (
            <div className="checkout-two-column">
              <form className="contact-form-card" onSubmit={handlePlaceOrder}>
                <Link className="text-link checkout-back-link" to="/cart">
                  <ArrowLeft size={13} aria-hidden="true" /> Return to bag
                </Link>
                <span className="section-kicker">Delivery Verification · Pay on Dispatch / Local Confirmation</span>
                <h2>Recipient &amp; shipping details</h2>

                <div className="address-form-grid checkout-form-grid">
                  <label className="contact-form-field form-span-two">
                    <span>Full name</span>
                    <input className="store-field" name="fullName" autoComplete="name" minLength={2} required />
                  </label>
                  <label className="contact-form-field">
                    <span>Email address</span>
                    <input className="store-field" name="email" type="email" autoComplete="email" required />
                  </label>
                  <label className="contact-form-field">
                    <span>Telephone</span>
                    <input className="store-field" name="phone" type="tel" autoComplete="tel" required />
                  </label>
                  <label className="contact-form-field form-span-two">
                    <span>Street address</span>
                    <input className="store-field" name="address" autoComplete="street-address" minLength={4} required />
                  </label>
                  <label className="contact-form-field">
                    <span>City</span>
                    <input className="store-field" name="city" autoComplete="address-level2" minLength={2} required />
                  </label>
                  <label className="contact-form-field">
                    <span>Postal code</span>
                    <input className="store-field" name="postalCode" autoComplete="postal-code" minLength={3} required />
                  </label>
                </div>

                {error && (
                  <p className="auth-error" role="alert">
                    {error}
                  </p>
                )}

                <button className="store-link checkout-submit-btn" type="submit" disabled={submitting}>
                  {submitting ? "Confirming order…" : `Confirm order · ${formatPrice(total, currency)}`}
                </button>
                <p className="availability-note">
                  <ShieldCheck size={14} aria-hidden="true" /> Complimentary delivery on rituals of $75 or more.
                </p>
              </form>

              <aside className="contact-info-card checkout-summary-card">
                <span className="section-kicker">Itemized Ritual</span>
                <h3>Order summary</h3>
                <ul className="checkout-items-list">
                  {validItems.map((item) => {
                    const product = products.find((entry) => entry.id === item.productId);
                    if (!product) return null;
                    const variant = Array.isArray(product.variants)
                      ? product.variants.find((entry) => entry && typeof entry === "object" && !Array.isArray(entry) && entry["id"] === item.variantId)
                      : null;
                    const unitPrice = variant && typeof variant === "object" && !Array.isArray(variant) && typeof variant["price"] === "number" ? variant["price"] : 0;
                    const label = variant && typeof variant === "object" && !Array.isArray(variant) && typeof variant["label"] === "string" ? variant["label"] : item.variantId;
                    return (
                      <li key={`${item.productId}-${item.variantId}`}>
                        <div>
                          <strong>{product.name}</strong>
                          <span>
                            {label} × {item.quantity}
                          </span>
                        </div>
                        <span className="tabular-nums">{formatPrice(unitPrice * item.quantity, currency)}</span>
                      </li>
                    );
                  })}
                </ul>
                <div className="checkout-totals">
                  <div>
                    <span>Subtotal</span>
                    <span className="tabular-nums">{formatPrice(subtotal, currency)}</span>
                  </div>
                  <div>
                    <span>Studio shipping</span>
                    <span className="tabular-nums">{shipping === 0 ? "Complimentary" : formatPrice(shipping, currency)}</span>
                  </div>
                  <div className="checkout-total-final">
                    <strong>Total due</strong>
                    <strong className="tabular-nums">{formatPrice(total, currency)}</strong>
                  </div>
                </div>
              </aside>
            </div>
          )}
        </div>
      </section>
    </Storefront>
  );
}