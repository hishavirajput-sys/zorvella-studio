import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, Heart, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Storefront, formatPrice, isPurchasableProduct, productStartingPrice, useStoreCart } from "@/components/storefront";
import { Button } from "@/components/ui/button";
import { productQueryOptions } from "@/lib/store-data";
import { toggleCustomerWishlist } from "@/lib/store-data";

export const Route = createFileRoute("/product/$slug")({
  head: ({ params }) => ({ meta: [
    { title: `${params.slug.replaceAll("-", " ")} — ZORVELLAE` },
    { name: "description", content: `Product details and approved formulation information from ZORVELLAE.` },
    { property: "og:title", content: `${params.slug.replaceAll("-", " ")} — ZORVELLAE` },
    { property: "og:description", content: "Explore approved ZORVELLAE skincare formulation details." },
    { property: "og:type", content: "product" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  loader: ({ context, params }) => context.queryClient.ensureQueryData(productQueryOptions(params.slug)),
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { data: product } = useSuspenseQuery(productQueryOptions(slug));
  const { addItem } = useStoreCart();
  const [variantId, setVariantId] = useState("");
  if (!product) {
    return <Storefront><div className="page-content"><div className="empty-catalog"><span className="eyebrow">The monograph is in preparation</span><h2>No published formulation found.</h2><Link to="/shop" className="text-link">Return to the shop</Link></div></div></Storefront>;
  }
  const images = Array.isArray(product.images) ? product.images : [];
  const image = images[0] && typeof images[0] === "object" && !Array.isArray(images[0]) ? images[0] : null;
  const variants = Array.isArray(product.variants) ? product.variants.filter((variant): variant is { id: string; label: string; price: number } => Boolean(variant) && typeof variant === "object" && !Array.isArray(variant) && typeof variant.id === "string" && typeof variant.label === "string" && typeof variant.price === "number") : [];
  const selectedVariant = variants.find((variant) => variant.id === variantId) ?? variants[0];
  const available = isPurchasableProduct(product);
  return (
    <Storefront>
      <div className="page-content"><Link className="text-link" to="/shop"><ArrowLeft size={14} /> Back to the formulations</Link></div>
      <section className="details-layout">
        <div className="product-details-photo">{typeof image?.url === "string" && image.url ? <img src={image.url} alt={typeof image.alt === "string" ? image.alt : product.name} /> : <div className="product-details-placeholder" aria-label="A ZORVELLAE product photograph is not yet available."><span>Z</span></div>}</div>
        <div className="product-details-copy">
          <span className="eyebrow">{product.category_label || "Botanical formulation"}</span>
          <h1>{product.name}</h1>
          <p>{product.description}</p>
          {variants.length > 0 && <p className="product-details-price" aria-live="polite">{formatPrice(selectedVariant?.price ?? productStartingPrice(product), product.currency)}</p>}
          {variants.length > 0 && <div className="variant-row"><label htmlFor="formulation-size">Choose your size</label><select className="variant-picker" id="formulation-size" value={variantId || variants[0]?.id || ""} onChange={(event) => setVariantId(event.target.value)}>{variants.map((variant) => <option value={variant.id} key={variant.id}>{variant.label} · {formatPrice(variant.price, product.currency)}</option>)}</select></div>}
          <Button type="button" className="store-link details-action" variant="default" disabled={!available || variants.length === 0} onClick={() => void addItem(product, selectedVariant?.id)}>{available ? "Add to your bag" : "Currently unavailable"}</Button>
          {!available && <p className="availability-note">{product.is_demo ? "Development samples are shown as a reference only and cannot be purchased." : "This formulation is not currently available for purchase."}</p>}
          {product.ingredients && <details><summary className="faq-list summary">Ingredients</summary><p>{product.ingredients}</p></details>}
          {product.usage && <details><summary className="faq-list summary">How to use</summary><p>{product.usage}</p></details>}
          {available && <div className="availability-note"><ShieldCheck size={14} /> Approved formulation listing</div>}
          <Button type="button" variant="outline" className="wishlist-action" aria-label={`Save ${product.name}`} onClick={async () => { try { await toggleCustomerWishlist(product.id); toast.success("Your saved formulations were updated."); } catch { toast.error("Sign in to save formulations."); } }}><Heart aria-hidden="true" /> Save</Button>
        </div>
      </section>
    </Storefront>
  );
}