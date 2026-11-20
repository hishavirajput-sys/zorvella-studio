CREATE TYPE public.app_role AS ENUM ('admin');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;
REVOKE ALL ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;
CREATE POLICY "Admins can assign roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.legacy_user_mappings (
  user_id UUID PRIMARY KEY,
  legacy_user_id TEXT NOT NULL UNIQUE,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.legacy_user_mappings TO authenticated;
GRANT ALL ON public.legacy_user_mappings TO service_role;
ALTER TABLE public.legacy_user_mappings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own legacy identity mapping" ON public.legacy_user_mappings FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_id TEXT UNIQUE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  banner_image TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  is_active BOOLEAN NOT NULL DEFAULT false,
  is_published BOOLEAN NOT NULL DEFAULT false,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Visitors can view active published categories" ON public.categories FOR SELECT TO anon, authenticated USING (is_active AND is_published);
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_id TEXT UNIQUE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  category_label TEXT NOT NULL DEFAULT '',
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  price NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  compare_at_price NUMERIC(12,2) CHECK (compare_at_price >= 0),
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  variants JSONB NOT NULL DEFAULT '[]'::jsonb,
  ingredients TEXT NOT NULL DEFAULT '',
  usage TEXT NOT NULL DEFAULT '',
  specifications JSONB NOT NULL DEFAULT '{}'::jsonb,
  badge TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  is_active BOOLEAN NOT NULL DEFAULT false,
  is_published BOOLEAN NOT NULL DEFAULT false,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  purchase_available BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT demo_products_not_purchasable CHECK (NOT is_demo OR NOT purchase_available)
);
GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Visitors can view active published products" ON public.products FOR SELECT TO anon, authenticated USING (is_active AND is_published);
CREATE POLICY "Admins can manage products" ON public.products FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE INDEX products_category_sort_idx ON public.products(category_id, is_active, is_published, sort_order);

CREATE TABLE public.ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_id TEXT UNIQUE,
  name TEXT NOT NULL,
  inci TEXT NOT NULL DEFAULT '',
  slug TEXT NOT NULL UNIQUE,
  summary TEXT NOT NULL DEFAULT '',
  monograph TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ingredients TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ingredients TO authenticated;
GRANT ALL ON public.ingredients TO service_role;
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Visitors can view published ingredients" ON public.ingredients FOR SELECT TO anon, authenticated USING (status = 'published');
CREATE POLICY "Admins can manage ingredients" ON public.ingredients FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.carts (
  user_id UUID PRIMARY KEY,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.carts TO authenticated;
GRANT ALL ON public.carts TO service_role;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customers manage only their own cart" ON public.carts FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.wishlists (
  user_id UUID PRIMARY KEY,
  product_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wishlists TO authenticated;
GRANT ALL ON public.wishlists TO service_role;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customers manage only their own wishlist" ON public.wishlists FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.customer_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_id TEXT UNIQUE,
  user_id UUID NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  address_line_1 TEXT NOT NULL,
  address_line_2 TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL,
  region TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_addresses TO authenticated;
GRANT ALL ON public.customer_addresses TO service_role;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customers manage only their own addresses" ON public.customer_addresses FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX customer_addresses_owner_created_idx ON public.customer_addresses(user_id, created_at);

CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_id TEXT UNIQUE,
  user_id UUID NOT NULL,
  reference TEXT NOT NULL UNIQUE,
  contact_email TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  shipping_address JSONB NOT NULL DEFAULT '{}'::jsonb,
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  shipping_status TEXT NOT NULL DEFAULT 'not_calculated',
  tax_status TEXT NOT NULL DEFAULT 'not_calculated',
  status TEXT NOT NULL DEFAULT 'placed' CHECK (status IN ('placed', 'processing', 'shipped', 'delivered', 'cancelled')),
  status_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  idempotency_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customers can view their own orders" ON public.orders FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can view orders" ON public.orders FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update orders" ON public.orders FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE INDEX orders_customer_created_idx ON public.orders(user_id, created_at DESC);

CREATE TABLE public.inventory_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  variant_id TEXT NOT NULL DEFAULT '',
  quantity_change INTEGER NOT NULL DEFAULT 0,
  reason TEXT NOT NULL DEFAULT '',
  changed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory_adjustments TO authenticated;
GRANT ALL ON public.inventory_adjustments TO service_role;
ALTER TABLE public.inventory_adjustments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage inventory adjustments" ON public.inventory_adjustments FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.content_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_id TEXT UNIQUE,
  page_key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.content_pages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_pages TO authenticated;
GRANT ALL ON public.content_pages TO service_role;
ALTER TABLE public.content_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Visitors can view published content" ON public.content_pages FOR SELECT TO anon, authenticated USING (status = 'published');
CREATE POLICY "Admins can manage all content" ON public.content_pages FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.store_settings (
  setting_key TEXT PRIMARY KEY,
  setting_value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.store_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.store_settings TO authenticated;
GRANT ALL ON public.store_settings TO service_role;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Visitors can view public store settings" ON public.store_settings FOR SELECT TO anon, authenticated USING (setting_key LIKE 'public.%');
CREATE POLICY "Admins can manage store settings" ON public.store_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_id TEXT UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT, SELECT ON public.contact_messages TO anon, authenticated;
GRANT UPDATE, DELETE ON public.contact_messages TO authenticated;
GRANT ALL ON public.contact_messages TO service_role;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Visitors can send a contact message" ON public.contact_messages FOR INSERT TO anon, authenticated WITH CHECK (status = 'new');
CREATE POLICY "Admins can read contact messages" ON public.contact_messages FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update contact messages" ON public.contact_messages FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete contact messages" ON public.contact_messages FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));