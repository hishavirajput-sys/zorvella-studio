import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Heart,
  Menu,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  Star,
  UserRound,
  X,
} from "lucide-react";

import serumImage from "@/assets/zorvellae-serum-editorial.png.asset.json";
import { ResponsiveStoreImage } from "@/components/responsive-image";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { notify } from "@/lib/notify";
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
        if (error) notify.error("Your saved bag could not be loaded.");
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
      notify.error("Your bag could not be saved. Please try again.");
      const { data } = await supabase.from("carts").select("items").eq("user_id", identityKey).maybeSingle();
      setItems(Array.isArray(data?.items) ? (data.items as unknown as CartItem[]) : []);
    }
  }, [identityKey]);

  const addItem = useCallback(async (product: StoreProduct, variantId?: string) => {
    if (!isPurchasableProduct(product)) {
      notify.error("This formulation is not available for purchase.");
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
      notify.error("This formulation has no available size.");
      return;
    }
    const entry = items.find((item) => item.productId === product.id && item.variantId === id);
    if (entry && entry.quantity >= 99) {
      notify.error("A maximum of 99 per size can be added.");
      return;
    }
    const next = entry
      ? items.map((item) => item === entry ? { ...item, quantity: item.quantity + 1 } : item)
      : [...items, { productId: product.id, variantId: id, quantity: 1 }];
    await persistCart(next);
    notify.success(`${product.name} added to your bag.`);
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
      <span className="announcement-spacer hidden md:block" aria-hidden="true" />
      <span className="announcement-copy">Thoughtful skincare. Science-led formulations.</span>
      <Link className="announcement-link" to="/contact">
        Contact us <ArrowRight size={11} aria-hidden="true" />
      </Link>
    </div>
  );
}

function StoreHeader() {
  const { items } = useStoreCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchCatalog, setSearchCatalog] = useState<Array<{ title: string; subtitle: string; to: string; slug?: string }>>([]);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      const user = await getSignedInUser().catch(() => null);
      if (active) setSignedIn(Boolean(user));
    };
    void refresh();
    const { data } = supabase.auth.onAuthStateChange(() => void refresh());
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!searchOpen || searchCatalog.length > 0) return;
    let active = true;
    void Promise.all([
      supabase.from("products").select("name, slug, category_label, is_published, is_active, is_demo").eq("is_published", true).eq("is_active", true).eq("is_demo", false),
      supabase.from("ingredients").select("name, inci, slug, status").eq("status", "published"),
    ]).then(([productsRes, ingredientsRes]) => {
      if (!active) return;
      const productEntries = (productsRes.data ?? []).map((entry) => ({
        title: entry.name,
        subtitle: entry.category_label || "Formulation",
        to: "/product/$slug",
        slug: entry.slug,
      }));
      const ingredientEntries = (ingredientsRes.data ?? []).map((entry) => ({
        title: entry.name,
        subtitle: entry.inci || "Ingredient monograph",
        to: "/ingredients",
      }));
      setSearchCatalog([...productEntries, ...ingredientEntries]);
    });
    return () => {
      active = false;
    };
  }, [searchOpen, searchCatalog.length]);

  const filteredResults = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return searchCatalog.slice(0, 5);
    return searchCatalog
      .filter((item) => item.title.toLowerCase().includes(q) || item.subtitle.toLowerCase().includes(q))
      .slice(0, 6);
  }, [searchCatalog, searchTerm]);

  return (
    <header className="store-header">
      <div className="store-header-inner">
        <Button variant="ghost" size="icon" className="store-icon-button mobile-menu-trigger" aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X /> : <Menu />}
        </Button>
        <Link to="/" className="brand-lockup" aria-label="Zorvellae, home">
          <img
            src="/site-assets/generated/zorvellae-logo-dark.png"
            alt="ZORVELLAE — Science-Led Skincare"
            className="brand-logo"
            width={180}
            height={60}
          />
        </Link>
        <nav className={`store-nav ${menuOpen ? "store-nav-open" : ""}`} aria-label="Main navigation">
          <Link to="/shop" onClick={() => setMenuOpen(false)}>Shop</Link>
          <Link to="/skin-concerns" onClick={() => setMenuOpen(false)}>Skin concerns</Link>
          <Link to="/routines" onClick={() => setMenuOpen(false)}>Skincare routines</Link>
          <Link to="/our-science" onClick={() => setMenuOpen(false)}>Our science</Link>
          <Link to="/ingredients" onClick={() => setMenuOpen(false)}>Ingredients</Link>
          <Link to="/about" onClick={() => setMenuOpen(false)}>About us</Link>
        </nav>
        <div className="store-header-actions">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="store-icon-button"
            aria-label={searchOpen ? "Close search" : "Search formulations and ingredients"}
            aria-expanded={searchOpen}
            onClick={() => setSearchOpen((open) => !open)}
          >
            {searchOpen ? <X aria-hidden="true" /> : <Search aria-hidden="true" />}
          </Button>
          <Link className="store-icon-link account-action" to={signedIn ? "/account" : "/login"} aria-label={signedIn ? "Your account" : "Sign in"}>
            <UserRound aria-hidden="true" />
          </Link>
          <Link className="store-icon-link bag-action" to="/cart" aria-label={`Shopping bag, ${items.reduce((count, item) => count + item.quantity, 0)} items`}>
            <ShoppingBag aria-hidden="true" />
            <span className="bag-count">{items.reduce((count, item) => count + item.quantity, 0)}</span>
          </Link>
        </div>
      </div>
      {searchOpen && (
        <div className="header-search-panel" role="search">
          <div className="header-search-inner">
            <div className="header-search-input-row">
              <Search size={15} aria-hidden="true" />
              <input
                type="search"
                className="header-search-input"
                placeholder="Search serums, ceramides, cleansers, or ingredient monographs…"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                autoFocus
              />
              <Button type="button" variant="ghost" size="sm" onClick={() => setSearchOpen(false)}>
                Close
              </Button>
            </div>
            <div className="header-search-results">
              {filteredResults.length > 0 ? (
                filteredResults.map((entry) =>
                  entry.slug ? (
                    <Link
                      key={`${entry.to}-${entry.slug}`}
                      to="/product/$slug"
                      params={{ slug: entry.slug }}
                      className="header-search-result"
                      onClick={() => setSearchOpen(false)}
                    >
                      <strong>{entry.title}</strong>
                      <span>{entry.subtitle}</span>
                    </Link>
                  ) : (
                    <Link
                      key={`${entry.to}-${entry.title}`}
                      to="/ingredients"
                      className="header-search-result"
                      onClick={() => setSearchOpen(false)}
                    >
                      <strong>{entry.title}</strong>
                      <span>{entry.subtitle}</span>
                    </Link>
                  ),
                )
              ) : (
                <p className="header-search-empty">No matching formulations or ingredients found.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export function StoreFooter() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  async function handleSubscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleaned = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) {
      notify.error("Please enter a valid email address.");
      return;
    }
    const { data } = await supabase
      .from("store_settings")
      .select("setting_value")
      .eq("setting_key", "newsletter.subscribers")
      .maybeSingle();
    const existing = Array.isArray(data?.setting_value)
      ? data.setting_value.filter((entry): entry is string => typeof entry === "string")
      : [];
    const next = existing.includes(cleaned) ? existing : [...existing, cleaned];
    await supabase
      .from("store_settings")
      .upsert({ setting_key: "newsletter.subscribers", setting_value: next });
    setSubscribed(true);
    setEmail("");
    notify.success("Welcome to the ZORVELLAE Circle.");
  }

  return (
    <footer className="store-footer">
      <div className="footer-main footer-main-editorial">
        <div className="footer-brand">
          <Link to="/" className="footer-brand-link" aria-label="Zorvellae, home">
            <img
              src="/site-assets/generated/zorvellae-logo-ivory.png"
              alt="ZORVELLAE — Science-Led Skincare"
              className="footer-logo"
              width={180}
              height={60}
              loading="lazy"
            />
          </Link>
          <p>
            Evidence-informed, transparent, botanical clinical formulations. Bridging
            dermatological rigour with sensory restorative rituals.
          </p>
          <span className="footer-certification">
            <CheckCircle2 size={13} aria-hidden="true" /> Clean Clinical Certified
          </span>
        </div>
        <div className="footer-column">
          <span className="eyebrow">Shop</span>
          <Link to="/shop/category/$slug" params={{ slug: "cleansers" }}>Cleansers &amp; Essences</Link>
          <Link to="/shop/category/$slug" params={{ slug: "serums" }}>Targeted Serums</Link>
          <Link to="/shop/category/$slug" params={{ slug: "barrier-creams" }}>Barrier Creams</Link>
          <Link to="/shop/category/$slug" params={{ slug: "eye-care" }}>Eye Treatments</Link>
          <Link to="/routines">Curated Ritual Bundles</Link>
        </div>
        <div className="footer-column">
          <span className="eyebrow">Skin Science</span>
          <Link to="/our-science">Clinical Trial Data</Link>
          <Link to="/ingredients">Ingredient Transparency</Link>
          <Link to="/routines">Routine Architecture</Link>
          <Link to="/about">About Zorvellae</Link>
        </div>
        <div className="footer-column footer-newsletter">
          <span className="eyebrow">Join the Zorvellae Circle</span>
          <p className="footer-newsletter-copy">
            Receive 15% off your first ritual, private invitations to clinical monograph releases, and
            botanical skincare formulation notes.
          </p>
          <form className="footer-newsletter-form" onSubmit={handleSubscribe}>
            <input
              type="email"
              aria-label="Email address for Zorvellae updates"
              placeholder="Enter your email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (subscribed) setSubscribed(false);
              }}
              required
            />
            <button type="submit">Subscribe</button>
          </form>
          {subscribed && (
            <p className="footer-newsletter-status" role="status">
              You are subscribed to ZORVELLAE formulation notes.
            </p>
          )}
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 ZORVELLAE Laboratories Inc. All formulations clinical grade.</span>
        <div className="footer-bottom-links">
          <Link to="/contact">Customer care</Link>
          <Link to="/about">Philosophy</Link>
          <span>United States (USD $)</span>
        </div>
      </div>
    </footer>
  );
}

export function PageHeading({
  eyebrow,
  title,
  description,
  className = "",
  imageSrc = serumImage.url,
  imageAlt = "ZORVELLAE serum bottles arranged on a stone slab with botanical shadows.",
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: string;
  className?: string;
  imageSrc?: string;
  imageAlt?: string;
}) {
  return (
    <div className={`page-heading ${className}`}>
      <div className="page-heading-copy">
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1 className="editorial-title">{title}</h1>
        {description && <p>{description}</p>}
      </div>
      <div className="page-heading-visual">
        <ResponsiveStoreImage
          src={imageSrc}
          alt={imageAlt}
          sizes="(max-width: 900px) 92vw, 44vw"
          loading="eager"
          fetchPriority="high"
        />
      </div>
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
  const specs =
    product.specifications && typeof product.specifications === "object" && !Array.isArray(product.specifications)
      ? product.specifications
      : null;
  const rating = specs && typeof specs["rating"] === "number" ? specs["rating"] : null;
  const reviews = specs && typeof specs["reviews"] === "number" ? specs["reviews"] : null;

  return (
    <article className="product-card">
      <Link className="product-image-frame" to="/product/$slug" params={{ slug: product.slug }} aria-label={`View ${product.name}`}>
        {hasImage ? (
          <ResponsiveStoreImage
            src={imageUrl}
            alt={typeof imageAlt === "string" ? imageAlt : product.name}
            sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 24vw"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="product-image-empty" aria-label="Product photograph not available">
            <span className="product-image-emblem">Z</span>
            <span className="product-image-label">{product.category_label || "Formulation"}</span>
          </div>
        )}
        {product.badge && <span className="product-badge">{product.badge}</span>}
        <Button
          type="button"
          aria-label={`Save ${product.name}`}
          title="Save formulation"
          variant="ghost"
          size="icon"
          className="wishlist-action"
          onClick={async (event) => {
            event.preventDefault();
            event.stopPropagation();
            try {
              await toggleCustomerWishlist(product.id);
              notify.success("Your saved formulations were updated.");
            } catch {
              notify.error("Sign in to save formulations.");
            }
          }}
        >
          <Heart aria-hidden="true" />
        </Button>
      </Link>
      <div className="product-card-copy">
        {rating !== null ? (
          <span className="product-rating-line">
            <Star size={11} aria-hidden="true" fill="currentColor" />
            <span>{rating.toFixed(1)}</span>
            {reviews !== null && <small>({reviews} reviews)</small>}
          </span>
        ) : (
          <span className="product-category-label">{product.category_label || "Botanical care"}</span>
        )}
        <Link to="/product/$slug" params={{ slug: product.slug }} className="product-name">{product.name}</Link>
        <p className="product-description">{product.description}</p>
        <div className="product-card-bottom">
          <span className="product-price">{formatPrice(productStartingPrice(product), product.currency)}</span>
          {onQuickAdd && (
            <Button
              size="sm"
              type="button"
              disabled={!available}
              className="brand-button product-add-button"
              aria-label={available ? `Quick add ${product.name} to bag` : `${product.name} not available for purchase`}
              onClick={() => void addItem(product)}
            >
              {available ? "Quick add" : "Unavailable"}
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