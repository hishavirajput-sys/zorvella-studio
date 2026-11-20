import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, Heart, Menu, Minus, Plus, ShoppingBag, UserRound, X } from "lucide-react";
import { toast } from "sonner";
import { LovableMark } from "@lovable.dev/cloud-auth-js/react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  calculateCartSubtotal,
  formatPrice,
  isPurchasableProduct,
  productStartingPrice,
  type CartItem,
  type StoreCategory,
  type StoreProduct,
} from "@/lib/store-domain";
import { getSignedInUser, saveCustomerCart, toggleCustomerWishlist } from "@/lib/store-data";

const CartContext = createContext<{
  items: CartItem[];
  loaded: boolean;
  addItem: (product: StoreProduct, variantId?: string) => Promise<void>;
  changeQuantity: (productId: string, variantId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string, variantId: string) => Promise<void>;
  clearCart: () => Promise<void>;
} | null>(null);

const GUEST_CART_KEY = "zorvellae-guest-cart";

function readGuestCart(): CartItem[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(GUEST_CART_KEY) ?? "[]");
    if (!Array.isArray(value)) return [];
    return value.filter(
      (item): item is CartItem =>
        Boolean(item) &&
        typeof item === "object" &&
        typeof item.productId === "string" &&
        typeof item.variantId === "string" &&
        Number.isSafeInteger(item.quantity) &&
        item.quantity > 0 &&
        item.quantity <= 99,
    );
  } catch {
    return [];
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [identityKey, setIdentityKey] = useState("guest");

  useEffect(() => {
    let mounted = true;
    const loadCart = async (userId: string | null) => {
      setLoaded(false);
      setIdentityKey(userId ?? "guest");
      if (userId) {
        const { data, error } = await supabase.from("carts").select("items").eq("user_id", userId).maybeSingle();
        if (!mounted) return;
        if (error) toast.error("Your saved bag could not be loaded.");
        const cart = Array.isArray(data?.items) ? (data.items as unknown as CartItem[]) : [];
        setItems(cart.filter((item) => item && typeof item.productId === "string" && typeof item.variantId === "string" && Number.isSafeInteger(item.quantity) && item.quantity > 0 && item.quantity <= 99));
      } else {
        setItems(readGuestCart());
      }
      if (mounted) setLoaded(true);
    };

    void supabase.auth.getUser().then(({ data, error }) => {
      void loadCart(error ? null : data.user?.id ?? null);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      void loadCart(session?.user.id ?? null);
    });
    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const persistCart = useCallback(async (next: CartItem[]) => {
    setItems(next);
    if (identityKey === "guest") {
      localStorage.setItem(GUEST_CART_KEY, JSON.stringify(next));
      return;
    }
    try {
      await saveCustomerCart(next);
    } catch {
      toast.error("Your bag could not be saved. Please try again.");
      const { data } = await supabase.from("carts").select("items").eq("user_id", identityKey).maybeSingle();
      setItems(Array.isArray(data?.items) ? (data.items as unknown as CartItem[]) : []);
    }
  }, [identityKey]);

  const addItem = useCallback(async (product: StoreProduct, variantId?: string) => {
    if (!isPurchasableProduct(product)) {
      toast.error("This formulation is not available for purchase.");
      return;
    }
    const variant = Array.isArray(product.variants)
      ? product.variants.find((value) => value && typeof value === "object" && !Array.isArray(value) && value["id"] === variantId)
      : undefined;
    const firstVariant = Array.isArray(product.variants) ? product.variants[0] : undefined;
    const variantIdValue = variant && typeof variant === "object" && !Array.isArray(variant) ? variant["id"] : undefined;
    const firstVariantId = firstVariant && typeof firstVariant === "object" && !Array.isArray(firstVariant) ? firstVariant["id"] : undefined;
    const id = typeof variantIdValue === "string" ? variantIdValue : typeof firstVariantId === "string" ? firstVariantId : "";
    if (!id) {
      toast.error("This formulation has no available size.");
      return;
    }
    const entry = items.find((item) => item.productId === product.id && item.variantId === id);
    if (entry && entry.quantity >= 99) {
      toast.error("A maximum of 99 per size can be added.");
      return;
    }
    const next = entry
      ? items.map((item) => item === entry ? { ...item, quantity: item.quantity + 1 } : item)
      : [...items, { productId: product.id, variantId: id, quantity: 1 }];
    await persistCart(next);
    toast.success(`${product.name} added to your bag.`);
  }, [items, persistCart]);

  const changeQuantity = useCallback(async (productId: string, variantId: string, quantity: number) => {
    if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 99) return;
    await persistCart(items.map((item) => item.productId === productId && item.variantId === variantId ? { ...item, quantity } : item));
  }, [items, persistCart]);

  const removeItem = useCallback(async (productId: string, variantId: string) => {
    await persistCart(items.filter((item) => item.productId !== productId || item.variantId !== variantId));
  }, [items, persistCart]);

  const clearCart = useCallback(async () => persistCart([]), [persistCart]);

  return <CartContext.Provider value={{ items, loaded, addItem, changeQuantity, removeItem, clearCart }}>{children}</CartContext.Provider>;
}

export function useStoreCart() {
  const cart = useContext(CartContext);
  if (!cart) throw new Error("Store pages must render within StoreProvider.");
  return cart;
}

export function Storefront({ children }: { children: ReactNode }) {
  return (
    <div className="site-frame">
      <AnnouncementBar />
      <StoreHeader />
      <main>{children}</main>
      <StoreFooter />
    </div>
  );
}

export function AnnouncementBar() {
  return (
    <div className="announcement-bar">
      <span>Botanical intelligence. Clinical intention.</span>
      <span className="hidden sm:inline">Considered skincare, without compromise</span>
    </div>
  );
}

function StoreHeader() {
  const { items } = useStoreCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [hasAdminAccess, setHasAdminAccess] = useState(false);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      const user = await getSignedInUser().catch(() => null);
      if (!active) return;
      setSignedIn(Boolean(user));
      if (!user) {
        setHasAdminAccess(false);
        return;
      }
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
      if (active) setHasAdminAccess(Boolean(data));
    };
    void refresh();
    const { data } = supabase.auth.onAuthStateChange(() => void refresh());
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  return (
    <header className="store-header">
      <div className="store-header-inner">
        <Button variant="ghost" size="icon" className="store-icon-button mobile-menu-trigger" aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X /> : <Menu />}
        </Button>
        <Link to="/" className="brand-lockup" aria-label="Zorvellae, home">
          <span className="brand-name">ZORVELLAE</span>
          <span className="brand-caption">Botanical science · Thoughtful ritual</span>
        </Link>
        <nav className={`store-nav ${menuOpen ? "store-nav-open" : ""}`} aria-label="Main navigation">
          <Link to="/shop" onClick={() => setMenuOpen(false)}>Shop all</Link>
          <Link to="/routines" onClick={() => setMenuOpen(false)}>Rituals</Link>
          <Link to="/skin-concerns" onClick={() => setMenuOpen(false)}>Skin concerns</Link>
          <Link to="/ingredients" onClick={() => setMenuOpen(false)}>Ingredients</Link>
          <Link to="/our-science" onClick={() => setMenuOpen(false)}>Our science</Link>
          {hasAdminAccess && <Link className="admin-nav-link" to="/admin" onClick={() => setMenuOpen(false)}>Store studio</Link>}
        </nav>
        <div className="store-header-actions">
          <Link className="store-icon-link account-action" to={signedIn ? "/account" : "/login"} aria-label={signedIn ? "Your account" : "Sign in"}>
            <UserRound aria-hidden="true" />
          </Link>
          <Link className="store-icon-link bag-action" to="/cart" aria-label={`Shopping bag, ${items.reduce((count, item) => count + item.quantity, 0)} items`}>
            <ShoppingBag aria-hidden="true" />
            <span className="bag-count">{items.reduce((count, item) => count + item.quantity, 0)}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

export function StoreFooter() {
  return (
    <footer className="store-footer">
      <div className="footer-main">
        <div className="footer-brand">
          <Link to="/" className="brand-name">ZORVELLAE</Link>
          <p>Botanical intelligence for the skin barrier, considered one ritual at a time.</p>
        </div>
        <div className="footer-column"><span className="eyebrow">Discover</span><Link to="/shop">Formulations</Link><Link to="/routines">Skin rituals</Link><Link to="/skin-concerns">Skin concerns</Link></div>
        <div className="footer-column"><span className="eyebrow">The science</span><Link to="/ingredients">Ingredient monographs</Link><Link to="/our-science">Our approach</Link><Link to="/about">Our story</Link></div>
        <div className="footer-column"><span className="eyebrow">Your space</span><Link to="/account">Your account</Link><Link to="/account/orders">Order history</Link><Link to="/contact">Contact</Link></div>
      </div>
      <div className="footer-bottom"><span>© ZORVELLAE</span><span>Formulated with intention.</span><Link to="/contact">Customer care <ArrowUpRight size={13} /></Link></div>
    </footer>
  );
}

export function PageHeading({ eyebrow, title, description, className = "" }: { eyebrow?: string; title: ReactNode; description?: string; className?: string }) {
  return (
    <div className={`page-heading ${className}`}>
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h1 className="editorial-title">{title}</h1>
      {description && <p>{description}</p>}
    </div>
  );
}

export function ProductCard({ product, onQuickAdd }: { product: StoreProduct; onQuickAdd?: boolean }) {
  const { addItem } = useStoreCart();
  const [imageError, setImageError] = useState(false);
  const firstImage = Array.isArray(product.images) ? product.images[0] : undefined;
  const imageUrl = firstImage && typeof firstImage === "object" && !Array.isArray(firstImage) ? firstImage["url"] : null;
  const imageAlt = firstImage && typeof firstImage === "object" && !Array.isArray(firstImage) ? firstImage["alt"] : null;
  const available = isPurchasableProduct(product);
  const hasImage = typeof imageUrl === "string" && imageUrl.trim() !== "" && !imageError;

  return (
    <article className="product-card">
      <Link className="product-image-frame" to="/product/$slug" params={{ slug: product.slug }} aria-label={`View ${product.name}`}>
        {hasImage ? <img src={imageUrl} alt={typeof imageAlt === "string" ? imageAlt : product.name} loading="lazy" onError={() => setImageError(true)} /> : (
          <div className="product-image-empty" aria-label="Product photograph not available">
            <span className="product-image-emblem">Z</span>
            <span className="product-image-label">{product.category_label || "Formulation"}</span>
          </div>
        )}
        {product.badge && <span className="product-badge">{product.badge}</span>}
        <Button type="button" aria-label={`Save ${product.name}`} title="Save formulation" variant="ghost" size="icon" className="wishlist-action" onClick={async (event) => { event.preventDefault(); event.stopPropagation(); try { await toggleCustomerWishlist(product.id); toast.success("Your saved formulations were updated."); } catch { toast.error("Sign in to save formulations."); } }}><Heart aria-hidden="true" /></Button>
      </Link>
      <div className="product-card-copy">
        <span className="product-category-label">{product.category_label || "Botanical care"}</span>
        <Link to="/product/$slug" params={{ slug: product.slug }} className="product-name">{product.name}</Link>
        <p className="product-description">{product.description}</p>
        <div className="product-card-bottom">
          <span className="product-price">{formatPrice(productStartingPrice(product), product.currency)}</span>
          {onQuickAdd && (
            <Button size="sm" type="button" disabled={!available} className="brand-button product-add-button" aria-label={available ? `Add ${product.name} to bag` : `${product.name} not available for purchase`} onClick={() => void addItem(product)}>
              {available ? "Add" : "Unavailable"}
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ products, onQuickAdd = true }: { products: StoreProduct[]; onQuickAdd?: boolean }) {
  if (products.length === 0) {
    return <div className="empty-catalog"><span className="catalog-mark">Z</span><span className="eyebrow">Thoughtfully in the making</span><h2>New formulations are on their way.</h2><p>Our current shop collection is being prepared. Please check back soon.</p><Link to="/contact" className="text-link">Ask our team <ArrowRight size={14} /></Link></div>;
  }
  return <div className="product-grid">{products.map((product) => <ProductCard key={product.id} product={product} onQuickAdd={onQuickAdd} />)}</div>;
}

export function CategoryCard({ category }: { category: StoreCategory }) {
  return <Link className="category-list-item" to="/shop/category/$slug" params={{ slug: category.slug }}><span className="category-list-number">{String(category.sort_order).padStart(2, "0")}</span><span>{category.name}</span><ArrowUpRight size={15} aria-hidden="true" /></Link>;
}

export function SignInOptions({ onGoogle, onLovable, loading }: { onGoogle: () => void; onLovable: () => void; loading: boolean }) {
  return (
    <div className="auth-provider-options">
      <Button type="button" variant="outline" disabled={loading} className="provider-button" onClick={onGoogle}>
        <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>
        Continue with Google
      </Button>
      <Button type="button" variant="outline" disabled={loading} className="provider-button" onClick={onLovable}>
        <LovableMark className="lovable-mark" /> Continue with Lovable
      </Button>
    </div>
  );
}

export async function startSocialSignIn(provider: "google" | "lovable") {
  const { lovable } = await import("@/integrations/lovable/index");
  const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: window.location.origin });
  if (result.error) throw result.error;
  if (!result.redirected) window.location.assign("/account");
}

export function QuantityStepper({ quantity, onChange }: { quantity: number; onChange: (nextQuantity: number) => void }) {
  return (
    <div className="quantity-stepper" aria-label="Quantity selector">
      <Button type="button" variant="ghost" size="icon" aria-label="Decrease quantity" disabled={quantity <= 1} onClick={() => onChange(quantity - 1)}><Minus size={13} /></Button>
      <span aria-live="polite">{quantity}</span>
      <Button type="button" variant="ghost" size="icon" aria-label="Increase quantity" disabled={quantity >= 99} onClick={() => onChange(quantity + 1)}><Plus size={13} /></Button>
    </div>
  );
}

export { calculateCartSubtotal, formatPrice, isPurchasableProduct, productStartingPrice };