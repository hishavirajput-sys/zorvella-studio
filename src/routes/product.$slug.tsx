import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, Heart, ShieldCheck, Star } from "lucide-react";
import { toast } from "sonner";

import { ResponsiveStoreImage } from "@/components/responsive-image";
import { ProductGrid, Storefront, formatPrice, isPurchasableProduct, productStartingPrice, useStoreCart } from "@/components/storefront";
import { Button } from "@/components/ui/button";
import { catalogQueryOptions, productQueryOptions, toggleCustomerWishlist } from "@/lib/store-data";

export const Route = createFileRoute("/product/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug.replaceAll("-", " ")} — ZORVELLAE` },
      { name: "description", content: "Product details, INCI transparency, and clinical usage guidelines from ZORVELLAE." },
      { property: "og:title", content: `${params.slug.replaceAll("-", " ")} — ZORVELLAE` },
      { property: "og:description", content: "Explore ZORVELLAE clinical skincare formulation details." },
      { property: "og:type", content: "product" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context, params }) =>
    Promise.all([
      context.queryClient.ensureQueryData(productQueryOptions(params.slug)),
      context.queryClient.ensureQueryData(catalogQueryOptions(undefined, false)),
    ]),
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { data: product } = useSuspenseQuery(productQueryOptions(slug));
  const { data: allProducts } = useSuspenseQuery(catalogQueryOptions(undefined, false));
  const { addItem } = useStoreCart();
  const [variantId, setVariantId] = useState("");

  const relatedProducts = useMemo(
    () => allProducts.filter((entry) => entry.slug !== slug).slice(0, 4),
    [allProducts, slug],
  );

  if (!product) {
    return (
      <Storefront>
        <div className="page-content">
          <div className="empty-catalog">
            <span className="eyebrow">Formulation Not Found</span>
            <h2>No published formulation matches this address.</h2>
            <Link to="/shop" className="text-link">
              Return to the shop
            </Link>
          </div>
        </div>
      </Storefront>
    );
  }

  const images = Array.isArray(product.images) ? product.images : [];
  const image = images[0] && typeof images[0] === "object" && !Array.isArray(images[0]) ? images[0] : null;
  const variants = Array.isArray(product.variants)
    ? product.variants.flatMap((variant) => {
        if (!variant || typeof variant !== "object" || Array.isArray(variant)) return [];
        const id = variant["id"];
        const label = variant["label"];
        const price = variant["price"];
        return typeof id === "string" && typeof label === "string" && typeof price === "number" ? [{ id, label, price }] : [];
      })
    : [];
  const selectedVariant = variants.find((variant) => variant.id === variantId) ?? variants[0];
  const available = isPurchasableProduct(product);
  const specs =
    product.specifications && typeof product.specifications === "object" && !Array.isArray(product.specifications)
      ? product.specifications
      : null;
  const rating = specs && typeof specs["rating"] === "number" ? specs["rating"] : null;
  const reviews = specs && typeof specs["reviews"] === "number" ? specs["reviews"] : null;
  const ritualStep = specs && typeof specs["ritual_step"] === "string" ? specs["ritual_step"] : null;

  return (
    <Storefront>
      <div className="pdp-breadcrumb-bar">
        <Link className="text-link" to="/shop">
          <ArrowLeft size={14} aria-hidden="true" /> Back to formulations
        </Link>
      </div>
      <section className="details-layout">
        <div className="product-details-photo">
          {typeof image?.["url"] === "string" && image["url"] ? (
            <ResponsiveStoreImage
              src={image["url"]}
              alt={typeof image["alt"] === "string" ? image["alt"] : product.name}
              sizes="(max-width: 900px) 92vw, 46vw"
              loading="eager"
              fetchPriority="high"
            />
          ) : (
            <div className="product-details-placeholder" aria-label="A ZORVELLAE product photograph is not yet available.">
              <span>Z</span>
            </div>
          )}
          {product.badge && <span className="product-badge">{product.badge}</span>}
        </div>
        <div className="product-details-copy">
          <span className="eyebrow">
            {product.category_label || "Botanical formulation"}
            {ritualStep ? ` · ${ritualStep}` : ""}
          </span>
          <h1>{product.name}</h1>
          {rating !== null && (
            <div className="pdp-rating-row">
              <span className="product-rating-line">
                <Star size={12} aria-hidden="true" fill="currentColor" />
                <span>{rating.toFixed(1)}</span>
                {reviews !== null && <small>({reviews} clinical reviews)</small>}
              </span>
            </div>
          )}
          <p>{product.description}</p>
          {variants.length > 0 && (
            <p className="product-details-price" aria-live="polite">
              {formatPrice(selectedVariant?.price ?? productStartingPrice(product), product.currency)}
            </p>
          )}
          {variants.length > 0 && (
            <div className="variant-row">
              <label htmlFor="formulation-size">Choose size</label>
              <div className="pdp-variant-buttons" role="group" aria-label="Formulation volume size">
                {variants.map((variant) => {
                  const isActive = (selectedVariant?.id ?? "") === variant.id;
                  return (
                    <button
                      key={variant.id}
                      type="button"
                      className={`concern-tab-button ${isActive ? "is-active" : ""}`}
                      onClick={() => setVariantId(variant.id)}
                    >
                      {variant.label} · {formatPrice(variant.price, product.currency)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <div className="pdp-actions-row">
            <Button
              type="button"
              className="store-link details-action"
              variant="default"
              disabled={!available || variants.length === 0}
              onClick={() => void addItem(product, selectedVariant?.id)}
            >
              {available ? "Add to bag" : "Currently unavailable"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="pdp-wishlist-button"
              aria-label={`Save ${product.name}`}
              onClick={async () => {
                try {
                  await toggleCustomerWishlist(product.id);
                  toast.success("Your saved formulations were updated.");
                } catch {
                  toast.error("Sign in to save formulations.");
                }
              }}
            >
              <Heart size={15} aria-hidden="true" /> Save
            </Button>
          </div>
          {!available && (
            <p className="availability-note">
              {product.is_demo
                ? "Studio preview samples are shown for editorial reference only."
                : "This formulation is temporarily out of stock."}
            </p>
          )}
          {product.ingredients && (
            <details open>
              <summary className="faq-list summary">Key ingredients &amp; INCI</summary>
              <p>{product.ingredients}</p>
            </details>
          )}
          {product.usage && (
            <details open>
              <summary className="faq-list summary">Ritual application</summary>
              <p>{product.usage}</p>
            </details>
          )}
          <details>
            <summary className="faq-list summary">Dermatological standards</summary>
            <p>Formulated without synthetic fragrance, drying alcohols, sulfates, silicones, or volatile essential oils. Dermatologist patch-tested on sensitive skin.</p>
          </details>
          {available && (
            <div className="availability-note">
              <ShieldCheck size={14} aria-hidden="true" /> Dermatologist tested · In stock and ready to dispatch
            </div>
          )}
        </div>
      </section>

      {relatedProducts.length > 0 && (
        <section className="featured-section pdp-related-section">
          <div className="section-heading section-heading-split">
            <div>
              <span className="section-kicker">Complete Your Cadence</span>
              <h2>Pair alongside this formulation</h2>
            </div>
            <Link className="text-link" to="/routines">
              Explore full routines
            </Link>
          </div>
          <ProductGrid products={relatedProducts} />
        </section>
      )}
    </Storefront>
  );
}