import type { Database } from "@/integrations/supabase/types";

export type StoreProduct = Database["public"]["Tables"]["products"]["Row"];
export type StoreCategory = Database["public"]["Tables"]["categories"]["Row"];
export type CartItem = { productId: string; variantId: string; quantity: number };

export function customerProfileMetadata(name: string) {
  return { full_name: name.trim() };
}

export function getInventoryStatus(quantity: number | undefined, lowStockThreshold = 5) {
  if (quantity === undefined || !Number.isSafeInteger(quantity) || quantity < 0) return "untracked" as const;
  if (quantity === 0) return "out_of_stock" as const;
  if (quantity <= lowStockThreshold) return "low_stock" as const;
  return "in_stock" as const;
}

export function isPurchasableProduct(product: Pick<StoreProduct, "is_active" | "is_published" | "is_demo" | "purchase_available">) {
  return product.is_active && product.is_published && !product.is_demo && product.purchase_available;
}

export function formatPrice(value: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value);
}

export function productStartingPrice(product: StoreProduct) {
  const variants = Array.isArray(product.variants) ? product.variants : [];
  const amounts = variants.flatMap((variant) => {
    if (!variant || typeof variant !== "object" || Array.isArray(variant)) return [];
    const price = variant["price"];
    return typeof price === "number" ? [price] : [];
  });
  return amounts.length > 0 ? Math.min(...amounts) : product.price;
}

export function calculateCartSubtotal(items: CartItem[], products: StoreProduct[]) {
  return items.reduce((subtotal, item) => {
    const product = products.find((entry) => entry.id === item.productId);
    if (!product || !isPurchasableProduct(product)) return subtotal;
    const variants = Array.isArray(product.variants) ? product.variants : [];
    const variant = variants.find(
      (entry) => entry && typeof entry === "object" && !Array.isArray(entry) && entry["id"] === item.variantId,
    );
    const price = variant && typeof variant === "object" && !Array.isArray(variant) ? variant["price"] : null;
    return subtotal + (typeof price === "number" && item.quantity > 0 ? price * item.quantity : 0);
  }, 0);
}