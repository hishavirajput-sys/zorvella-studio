import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { filterCatalogProducts, type CartItem, type StoreCategory, type StoreProduct } from "@/lib/store-domain";

export const catalogQueryOptions = (categorySlug?: string, includeDemo = false) =>
  queryOptions({
    queryKey: ["store", "catalog", categorySlug ?? "all", includeDemo ? "including-demo" : "excluding-demo"],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .eq("is_published", true)
        .order("sort_order");
      if (categorySlug) {
        const { data: category, error: categoryError } = await supabase
          .from("categories")
          .select("id")
          .eq("slug", categorySlug)
          .maybeSingle();
        if (categoryError) throw categoryError;
        if (!category) return [] satisfies StoreProduct[];
        query = query.eq("category_id", category.id);
      }
      const { data, error } = await query;
      if (error) throw error;
      return filterCatalogProducts(data, includeDemo);
    },
  });

export const productQueryOptions = (slug: string) =>
  queryOptions({
    queryKey: ["store", "product", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .eq("is_published", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const categoriesQueryOptions = queryOptions({
  queryKey: ["store", "categories"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .eq("is_published", true)
      .order("sort_order");
    if (error) throw error;
    return data satisfies StoreCategory[];
  },
});

export async function getSignedInUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error?.name === "AuthSessionMissingError") return null;
  if (error) throw error;
  return data.user;
}

export async function getCustomerCart() {
  const user = await getSignedInUser();
  if (!user) return null;
  const { data, error } = await supabase.from("carts").select("items").eq("user_id", user.id).maybeSingle();
  if (error) throw error;
  return Array.isArray(data?.items) ? (data.items as unknown as CartItem[]) : [];
}

export async function saveCustomerCart(items: CartItem[]) {
  const user = await getSignedInUser();
  if (!user) throw new Error("Sign in before updating your cart.");
  const { error } = await supabase.from("carts").upsert({ user_id: user.id, items: items as never });
  if (error) throw error;
  return items;
}

export async function toggleCustomerWishlist(productId: string) {
  const user = await getSignedInUser();
  if (!user) throw new Error("Sign in to save your formulations.");
  const { data: existing, error: readError } = await supabase
    .from("wishlists")
    .select("product_ids")
    .eq("user_id", user.id)
    .maybeSingle();
  if (readError) throw readError;
  const current = Array.isArray(existing?.product_ids) ? existing.product_ids.filter((entry): entry is string => typeof entry === "string") : [];
  const product_ids = current.includes(productId)
    ? current.filter((entry) => entry !== productId)
    : [...current, productId];
  const { error } = await supabase.from("wishlists").upsert({ user_id: user.id, product_ids: product_ids as never });
  if (error) throw error;
  return product_ids;
}

export const wishlistQueryOptions = queryOptions({
  queryKey: ["store", "wishlist"],
  queryFn: async () => {
    const user = await getSignedInUser();
    if (!user) return null;
    const { data, error } = await supabase.from("wishlists").select("product_ids").eq("user_id", user.id).maybeSingle();
    if (error) throw error;
    return Array.isArray(data?.product_ids) ? data.product_ids.filter((entry): entry is string => typeof entry === "string") : [];
  },
});

export const customerAddressesQueryOptions = queryOptions({
  queryKey: ["account", "addresses"],
  queryFn: async () => {
    const user = await getSignedInUser();
    if (!user) return null;
    const { data, error } = await supabase
      .from("customer_addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at");
    if (error) throw error;
    return data;
  },
});

export const customerOrdersQueryOptions = queryOptions({
  queryKey: ["account", "orders"],
  queryFn: async () => {
    const user = await getSignedInUser();
    if (!user) return null;
    const { data, error } = await supabase
      .from("orders")
      .select("id, reference, status, currency, subtotal, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
});

export async function saveCustomerAddress(address: {
  first_name: string;
  last_name: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  region: string;
  postal_code: string;
  country: string;
}) {
  const user = await getSignedInUser();
  if (!user) throw new Error("Sign in before saving an address.");
  const { error } = await supabase.from("customer_addresses").insert({ ...address, user_id: user.id });
  if (error) throw error;
}

export async function deleteCustomerAddress(id: string) {
  const user = await getSignedInUser();
  if (!user) throw new Error("Sign in before removing an address.");
  const { error } = await supabase.from("customer_addresses").delete().eq("id", id).eq("user_id", user.id);
  if (error) throw error;
}