import type { AuthChangeEvent, Session, SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "./types";

type Row = Record<string, unknown>;

type AuthListener = (event: AuthChangeEvent, session: Session | null) => void;

type MockAccount = {
  user: User;
  password: string;
};

type PersistedStore = {
  seeded?: boolean;
  tables: Record<string, Row[]>;
  accounts: Record<string, MockAccount>;
  currentSession: Session | null;
};

const STORAGE_KEY = "zorvellae_local_store_v3";

function createDefaultSeedTables(): Record<string, Row[]> {
  const now = "2026-03-01T09:00:00.000Z";
  const cleansersId = "11111111-1111-4111-8111-111111111101";
  const serumsId = "11111111-1111-4111-8111-111111111102";
  const creamsId = "11111111-1111-4111-8111-111111111103";
  const eyeCareId = "11111111-1111-4111-8111-111111111104";

  return {
    categories: [
      {
        id: cleansersId,
        name: "Essential Cleansers",
        slug: "cleansers",
        description: "Barrier-sparing amino acid cleansing balms & micellar broths.",
        banner_image: "/site-assets/generated/product_melt_cleanser_1795670127118.jpg",
        is_active: true,
        is_published: true,
        is_demo: false,
        legacy_id: null,
        sort_order: 1,
        created_at: now,
        updated_at: now,
      },
      {
        id: serumsId,
        name: "Treatment Serums",
        slug: "serums",
        description: "Concentrated bio-peptides, clinical ferments, and stable vitamin matrices.",
        banner_image: "/site-assets/generated/product_barrier_serum_1795670125183.jpg",
        is_active: true,
        is_published: true,
        is_demo: false,
        legacy_id: null,
        sort_order: 2,
        created_at: now,
        updated_at: now,
      },
      {
        id: creamsId,
        name: "Barrier Creams",
        slug: "barrier-creams",
        description: "Squalane and lipid emulsions that lock hydration for 48 uninterrupted hours.",
        banner_image: "/site-assets/generated/product_rosehip_cream_1795670125752.jpg",
        is_active: true,
        is_published: true,
        is_demo: false,
        legacy_id: null,
        sort_order: 3,
        created_at: now,
        updated_at: now,
      },
      {
        id: eyeCareId,
        name: "Restorative Eye Elixirs",
        slug: "eye-care",
        description: "Caffeine-infused micro-peptides targeting orbital lymph drainage and dark circles.",
        banner_image: "/site-assets/generated/product_eye_balm_1795670126729.jpg",
        is_active: true,
        is_published: true,
        is_demo: false,
        legacy_id: null,
        sort_order: 4,
        created_at: now,
        updated_at: now,
      },
    ],
    products: [
      {
        id: "22222222-2222-4222-8222-222222222201",
        name: "Ceramide + Bio-Peptide Barrier Serum",
        slug: "ceramide-bio-peptide-barrier-serum",
        badge: "Best seller",
        category_id: serumsId,
        category_label: "Treatment Serums",
        price: 68,
        compare_at_price: null,
        currency: "USD",
        description: "30ml · Rebuilds stratum corneum integrity",
        ingredients: "Bio-Ceramide III (Ceramide NP), Signal Bio-Peptide Complex, Multi-Molecular Hyaluronic Acid, Centella Asiatica Triterpenes, Panthenol (Pro-Vitamin B5).",
        usage: "Apply 3–4 drops onto damp skin morning and evening after cleansing, pressing gently before sealing with a barrier cream.",
        images: [{ url: "/site-assets/generated/product_barrier_serum_1795670125183.jpg", alt: "Ceramide + Bio-Peptide Barrier Serum frosted amber glass bottle on warm travertine stone" }],
        variants: [
          { id: "30ml", label: "30 ml", price: 68 },
          { id: "50ml", label: "50 ml", price: 96 },
        ],
        stock_by_variant: { "30ml": 42, "50ml": 18 },
        low_stock_threshold: 5,
        specifications: { rating: 4.9, reviews: 428, ritual_step: "Step 02 · Treat" },
        is_active: true,
        is_published: true,
        is_demo: false,
        purchase_available: true,
        legacy_id: null,
        sort_order: 1,
        created_at: now,
        updated_at: now,
      },
      {
        id: "22222222-2222-4222-8222-222222222202",
        name: "Phyto-Niacinamide Radiance Elixir",
        slug: "phyto-niacinamide-radiance-elixir",
        badge: "Clinical favorite",
        category_id: serumsId,
        category_label: "Treatment Serums",
        price: 64,
        compare_at_price: null,
        currency: "USD",
        description: "30ml · 10% Niacinamide + Alpine Edelweiss",
        ingredients: "Niacinamide (10%), Leontopodium Alpinum (Alpine Edelweiss) Meristem Extract, Fermented Licorice Root, Zinc PCA, Ectoin.",
        usage: "Dispense 2–3 drops onto clean skin in the morning ritual to support even tone and calm surface reactivity.",
        images: [{ url: "/site-assets/generated/product_radiance_elixir_1795670125654.jpg", alt: "Phyto-Niacinamide Radiance Elixir frosted serum dropper beside alpine edelweiss botanicals" }],
        variants: [
          { id: "30ml", label: "30 ml", price: 64 },
          { id: "50ml", label: "50 ml", price: 88 },
        ],
        stock_by_variant: { "30ml": 35, "50ml": 22 },
        low_stock_threshold: 5,
        specifications: { rating: 4.8, reviews: 312, ritual_step: "Step 02 · Treat" },
        is_active: true,
        is_published: true,
        is_demo: false,
        purchase_available: true,
        legacy_id: null,
        sort_order: 2,
        created_at: now,
        updated_at: now,
      },
      {
        id: "22222222-2222-4222-8222-222222222203",
        name: "Squalane & Fermented Rosehip Cream",
        slug: "squalane-fermented-rosehip-cream",
        badge: "Deep hydration",
        category_id: creamsId,
        category_label: "Barrier Creams",
        price: 74,
        compare_at_price: null,
        currency: "USD",
        description: "50ml · Lipid replenish & overnight barrier sealant",
        ingredients: "Sugarcane Bio-Squalane, Fermented Rosa Canina (Rosehip) Seed Lipids, 3:1:1 Skin-Identical Ceramide Matrix, Beta-Glucan, Shea Unsaponifiables.",
        usage: "Warm a pearl-sized measure between fingertips and press across face and neck morning and night to lock moisture.",
        images: [{ url: "/site-assets/generated/product_rosehip_cream_1795670125752.jpg", alt: "Squalane & Fermented Rosehip Cream matte alabaster jar beside ceramic spatula on travertine" }],
        variants: [
          { id: "50ml", label: "50 ml", price: 74 },
          { id: "100ml", label: "100 ml", price: 118 },
        ],
        stock_by_variant: { "50ml": 29, "100ml": 14 },
        low_stock_threshold: 5,
        specifications: { rating: 5.0, reviews: 516, ritual_step: "Step 03 · Hydrate" },
        is_active: true,
        is_published: true,
        is_demo: false,
        purchase_available: true,
        legacy_id: null,
        sort_order: 3,
        created_at: now,
        updated_at: now,
      },
      {
        id: "22222222-2222-4222-8222-222222222204",
        name: "Peptide Gentle Melt Cleanser",
        slug: "peptide-gentle-melt-cleanser",
        badge: "Gentle formula",
        category_id: cleansersId,
        category_label: "Essential Cleansers",
        price: 42,
        compare_at_price: null,
        currency: "USD",
        description: "150ml · Dissolves impurities without micro-tears",
        ingredients: "Sodium Cocoyl Glutamate, Hydrolyzed Rice Peptides, Colloidal Oat Beta-Glucan, Camellia Seed Oil, Thermal Ferment Filtrate.",
        usage: "Massage gently onto damp skin for 45 seconds using slow circular motions, then rinse cleanly with lukewarm water.",
        images: [{ url: "/site-assets/generated/product_melt_cleanser_1795670127118.jpg", alt: "Peptide Gentle Melt Cleanser matte pump bottle beside soothing emulsion drops and river stones" }],
        variants: [
          { id: "150ml", label: "150 ml", price: 42 },
          { id: "250ml", label: "250 ml", price: 62 },
        ],
        stock_by_variant: { "150ml": 54, "250ml": 26 },
        low_stock_threshold: 5,
        specifications: { rating: 4.9, reviews: 189, ritual_step: "Step 01 · Cleanse" },
        is_active: true,
        is_published: true,
        is_demo: false,
        purchase_available: true,
        legacy_id: null,
        sort_order: 4,
        created_at: now,
        updated_at: now,
      },
      {
        id: "22222222-2222-4222-8222-222222222205",
        name: "Restorative Peptide Eye Balm",
        slug: "restorative-peptide-eye-balm",
        badge: "Orbital care",
        category_id: eyeCareId,
        category_label: "Restorative Eye Elixirs",
        price: 58,
        compare_at_price: null,
        currency: "USD",
        description: "15ml · Caffeine-infused micro-peptides for delicate eye contours",
        ingredients: "Acetyl Tetrapeptide-5, Bio-Fermented Caffeine, Escin, Ceramide NP, Meadowfoam Seed Oil.",
        usage: "Pat half a pea-sized amount along the orbital bone morning and evening with the ring finger.",
        images: [{ url: "/site-assets/generated/product_eye_balm_1795670126729.jpg", alt: "Restorative Peptide Eye Balm dark amber vessel on stone block in morning shadows" }],
        variants: [{ id: "15ml", label: "15 ml", price: 58 }],
        stock_by_variant: { "15ml": 31 },
        low_stock_threshold: 5,
        specifications: { rating: 4.9, reviews: 214, ritual_step: "Step 04 · Protect" },
        is_active: true,
        is_published: true,
        is_demo: false,
        purchase_available: true,
        legacy_id: null,
        sort_order: 5,
        created_at: now,
        updated_at: now,
      },
    ],
    ingredients: [
      {
        id: "33333333-3333-4333-8333-333333333301",
        name: "Bio-Ceramide III",
        inci: "Ceramide NP · Biomimetic Lipid Complex",
        slug: "bio-ceramide-iii",
        summary: "Skin-identical lamellar lipid formulated in a physiological 3:1:1 ratio to reinforce stratum corneum cohesion.",
        monograph: "Ceramide NP mirrors the native intercellular mortar between corneocytes. Paired with cholesterol and free fatty acids, it helps reduce trans-epidermal water loss (TEWL) and calm sensitized reactive barriers.",
        status: "published",
        sort_order: 1,
        legacy_id: null,
        created_at: now,
        updated_at: now,
      },
      {
        id: "33333333-3333-4333-8333-333333333302",
        name: "Phyto-Niacinamide",
        inci: "Niacinamide + Leontopodium Alpinum Extract",
        slug: "phyto-niacinamide",
        summary: "Bio-available vitamin B3 paired with alpine botanical antioxidants for refined tone clarity without stinging.",
        monograph: "Buffered to skin-neutral pH (5.5–6.0), pharmaceutical-grade niacinamide supports endogenous ceramide synthesis, regulates sebum flow, and helps visibly calm post-inflammatory redness.",
        status: "published",
        sort_order: 2,
        legacy_id: null,
        created_at: now,
        updated_at: now,
      },
      {
        id: "33333333-3333-4333-8333-333333333303",
        name: "Fermented Rosehip Lipids",
        inci: "Pseudozyma Epicola / Rosa Canina Fruit Oil Ferment",
        slug: "fermented-rosehip-lipids",
        summary: "Bio-fermented omega fatty acids and trans-retinoic precursors with enhanced dermal compatibility.",
        monograph: "Controlled microbial fermentation cleaves heavy plant triglycerides into smaller bio-available free fatty acids, delivering weightless barrier nourishment ideal for reactive and dry complexions.",
        status: "published",
        sort_order: 3,
        legacy_id: null,
        created_at: now,
        updated_at: now,
      },
      {
        id: "33333333-3333-4333-8333-333333333304",
        name: "Signal Bio-Peptide Complex",
        inci: "Palmitoyl Tripeptide-1 · Tetrapeptide-7 · Rice Peptides",
        slug: "signal-bio-peptide-complex",
        summary: "Targeted short-chain amino acid sequences that signal firmness and elastin resilience without irritation.",
        monograph: "Low-dalton signal peptides communicate directly with fibroblasts across intact epidermis, supporting collagen matrix density while remaining 100% calm on reactive, barrier-depleted skin.",
        status: "published",
        sort_order: 4,
        legacy_id: null,
        created_at: now,
        updated_at: now,
      },
      {
        id: "33333333-3333-4333-8333-333333333305",
        name: "Sugarcane Bio-Squalane",
        inci: "Squalane (Renewable Botanical Hydrocarbon)",
        slug: "sugarcane-bio-squalane",
        summary: "Weightless, non-comedogenic emollient identical to human sebum squalene for 48-hour softness.",
        monograph: "Bio-fermented exclusively from traceable sugarcane without olive or shark sourcing, hydrogenated squalane stays oxidation-stable while cushioning sensitive skin against seasonal moisture loss.",
        status: "published",
        sort_order: 5,
        legacy_id: null,
        created_at: now,
        updated_at: now,
      },
      {
        id: "33333333-3333-4333-8333-333333333306",
        name: "Centella Triterpenes",
        inci: "Madecassoside · Asiaticoside · Centella Asiatica Extract",
        slug: "centella-triterpenes",
        summary: "Purified botanical fractions calibrated to quiet neurogenic redness and support surface comfort.",
        monograph: "Isolated triterpene saponins from cold-extracted Gotu Kola leaves attenuate cytokine reactivity after UV exposure, harsh surfactants, or dry indoor heating.",
        status: "published",
        sort_order: 6,
        legacy_id: null,
        created_at: now,
        updated_at: now,
      },
    ],
    store_settings: [
      {
        setting_key: "store.configuration",
        setting_value: {
          storeName: "ZORVELLAE",
          currencyCode: "USD",
          contactEmail: "care@zorvellae.com",
        },
        updated_at: now,
        updated_by: null,
      },
      {
        setting_key: "public.contact",
        setting_value: {
          storeName: "ZORVELLAE",
          email: "care@zorvellae.com",
        },
        updated_at: now,
        updated_by: null,
      },
    ],
  };
}

const memoryStore: PersistedStore = {
  seeded: false,
  tables: {},
  accounts: {},
  currentSession: null,
};

let hydratedFromStorage = false;
const authListeners = new Set<AuthListener>();

function ensureHydrated() {
  if (hydratedFromStorage) return;
  hydratedFromStorage = true;

  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<PersistedStore>;
        if (parsed.tables && typeof parsed.tables === "object") {
          memoryStore.tables = parsed.tables;
          memoryStore.seeded = Boolean(parsed.seeded ?? Object.keys(parsed.tables).length > 0);
        }
        if (parsed.accounts && typeof parsed.accounts === "object") {
          memoryStore.accounts = parsed.accounts;
        }
        if (parsed.currentSession !== undefined) {
          memoryStore.currentSession = parsed.currentSession;
        }
      }
    } catch {
      // Ignore malformed localStorage state
    }
  }

  if (!memoryStore.seeded) {
    memoryStore.tables = { ...createDefaultSeedTables(), ...memoryStore.tables };
    memoryStore.seeded = true;
    persistStore();
  }
}

function persistStore() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryStore));
  } catch {
    // Ignore storage quota or private-mode errors
  }
}

function getTableRows(table: string): Row[] {
  ensureHydrated();
  let rows = memoryStore.tables[table];
  if (!rows) {
    rows = [];
    memoryStore.tables[table] = rows;
  }
  return rows;
}

function cloneRow<T>(value: T): T {
  return structuredClone(value);
}

function notifyAuthListeners(event: AuthChangeEvent, session: Session | null) {
  for (const listener of authListeners) {
    try {
      listener(event, session);
    } catch {
      // Ignore listener errors in local auth notifications
    }
  }
}

function makeQueryResult<T>(data: T, count: number | null = null) {
  return {
    data,
    error: null,
    count,
    status: 200,
    statusText: "OK",
  };
}

function makeErrorResult(message: string, code?: string) {
  return {
    data: null,
    error: { message, ...(code ? { code } : {}) },
    count: null,
    status: 400,
    statusText: "Bad Request",
  };
}

const UNIQUE_FIELDS_BY_TABLE: Record<string, string[]> = {
  products: ["slug"],
  categories: ["slug"],
  ingredients: ["slug"],
  content_pages: ["page_key"],
  orders: ["reference"],
};

class MockQueryBuilder implements PromiseLike<{
  data: unknown;
  error: { message: string; code?: string } | null;
  count: number | null;
  status: number;
  statusText: string;
}> {
  private readonly table: string;
  private mode: "select" | "insert" | "update" | "upsert" | "delete" = "select";
  private headOnly = false;
  private countMode: "exact" | "planned" | "estimated" | null = null;
  private filters: Array<(row: Row) => boolean> = [];
  private orders: Array<{ column: string; ascending: boolean }> = [];
  private limitCount: number | null = null;
  private singleMode: "none" | "single" | "maybeSingle" = "none";
  private payload: unknown = null;

  constructor(table: string) {
    this.table = table;
  }

  select(
    _columns?: string,
    options?: { count?: "exact" | "planned" | "estimated"; head?: boolean },
  ) {
    if (this.mode === "select") {
      this.headOnly = Boolean(options?.head);
      this.countMode = options?.count ?? null;
    }
    return this;
  }

  insert(values: Row | Row[]) {
    this.mode = "insert";
    this.payload = values;
    return this;
  }

  update(values: Row) {
    this.mode = "update";
    this.payload = values;
    return this;
  }

  upsert(values: Row | Row[]) {
    this.mode = "upsert";
    this.payload = values;
    return this;
  }

  delete() {
    this.mode = "delete";
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push((row) => row[column] === value);
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orders.push({ column, ascending: options?.ascending ?? true });
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  single() {
    this.singleMode = "single";
    return this;
  }

  maybeSingle() {
    this.singleMode = "maybeSingle";
    return this;
  }

  private execute() {
    const tableRows = getTableRows(this.table);
    const now = new Date().toISOString();
    const uniqueFields = UNIQUE_FIELDS_BY_TABLE[this.table] ?? [];

    if (this.mode === "insert") {
      const items = Array.isArray(this.payload) ? this.payload : [this.payload];
      for (const raw of items) {
        const candidate = raw as Row;
        for (const field of uniqueFields) {
          const value = candidate[field];
          if (value !== undefined && tableRows.some((row) => row[field] === value)) {
            return makeErrorResult(`Duplicate value for ${field}`, "23505");
          }
        }
      }
      const inserted = items.map((item) => {
        const record: Row = { ...(item as Row) };
        if (typeof record["id"] !== "string") {
          record["id"] = crypto.randomUUID();
        }
        if (typeof record["created_at"] !== "string") {
          record["created_at"] = now;
        }
        if (typeof record["updated_at"] !== "string") {
          record["updated_at"] = now;
        }
        if (this.table === "contact_messages" && typeof record["status"] !== "string") {
          record["status"] = "new";
        }
        if (this.table === "content_pages" && typeof record["status"] !== "string") {
          record["status"] = "draft";
        }
        if (this.table === "products") {
          if (record["stock_by_variant"] === undefined) record["stock_by_variant"] = {};
          if (record["low_stock_threshold"] === undefined) record["low_stock_threshold"] = 5;
        }
        tableRows.push(record);
        return cloneRow(record);
      });
      persistStore();
      if (this.singleMode !== "none") {
        return makeQueryResult(inserted[0] ?? null);
      }
      return makeQueryResult(inserted);
    }

    if (this.mode === "upsert") {
      const items = Array.isArray(this.payload) ? this.payload : [this.payload];
      const keyField =
        this.table === "carts" || this.table === "wishlists"
          ? "user_id"
          : this.table === "store_settings"
            ? "setting_key"
            : "id";
      const upserted: Row[] = [];
      for (const raw of items) {
        const record: Row = { ...(raw as Row), updated_at: now };
        const keyValue = record[keyField];
        const existingIndex =
          keyValue !== undefined
            ? tableRows.findIndex((entry) => entry[keyField] === keyValue)
            : -1;
        if (existingIndex >= 0) {
          tableRows[existingIndex] = { ...tableRows[existingIndex], ...record };
          upserted.push(cloneRow(tableRows[existingIndex] as Row));
        } else {
          if (keyField === "id" && typeof record["id"] !== "string") {
            record["id"] = crypto.randomUUID();
          }
          if (typeof record["created_at"] !== "string") {
            record["created_at"] = now;
          }
          tableRows.push(record);
          upserted.push(cloneRow(record));
        }
      }
      persistStore();
      if (this.singleMode !== "none") {
        return makeQueryResult(upserted[0] ?? null);
      }
      return makeQueryResult(upserted);
    }

    if (this.mode === "update") {
      const patch = (this.payload ?? {}) as Row;
      for (const field of uniqueFields) {
        const value = patch[field];
        if (
          value !== undefined &&
          tableRows.some((row) => !this.filters.every((fn) => fn(row)) && row[field] === value)
        ) {
          return makeErrorResult(`Duplicate value for ${field}`, "23505");
        }
      }
      const updated: Row[] = [];
      for (let i = 0; i < tableRows.length; i++) {
        const row = tableRows[i];
        if (!row) continue;
        if (this.filters.every((fn) => fn(row))) {
          const next = { ...row, ...patch, updated_at: now };
          tableRows[i] = next;
          updated.push(cloneRow(next));
        }
      }
      persistStore();
      if (this.singleMode !== "none") {
        return makeQueryResult(updated[0] ?? null);
      }
      return makeQueryResult(updated);
    }

    if (this.mode === "delete") {
      const removed: Row[] = [];
      for (let i = tableRows.length - 1; i >= 0; i--) {
        const row = tableRows[i];
        if (!row) continue;
        if (this.filters.every((fn) => fn(row))) {
          removed.push(cloneRow(row));
          tableRows.splice(i, 1);
        }
      }
      persistStore();
      return makeQueryResult(removed);
    }

    let matched = tableRows.filter((row) => this.filters.every((fn) => fn(row)));
    const totalCount = matched.length;

    if (this.orders.length > 0) {
      matched = [...matched].sort((a, b) => {
        for (const { column, ascending } of this.orders) {
          const left = a[column];
          const right = b[column];
          if (left === right) continue;
          if (left === undefined || left === null) return ascending ? 1 : -1;
          if (right === undefined || right === null) return ascending ? -1 : 1;
          if (left < right) return ascending ? -1 : 1;
          if (left > right) return ascending ? 1 : -1;
        }
        return 0;
      });
    }

    if (this.limitCount !== null) {
      matched = matched.slice(0, this.limitCount);
    }

    if (this.headOnly) {
      return makeQueryResult(null, this.countMode ? totalCount : null);
    }

    const cloned = matched.map((row) => cloneRow(row));
    if (this.singleMode === "maybeSingle") {
      return makeQueryResult(cloned[0] ?? null, this.countMode ? totalCount : null);
    }
    if (this.singleMode === "single") {
      if (!cloned[0]) {
        return makeErrorResult("Row not found", "PGRST116");
      }
      return makeQueryResult(cloned[0], this.countMode ? totalCount : null);
    }
    return makeQueryResult(cloned, this.countMode ? totalCount : null);
  }

  then<TResult1 = ReturnType<MockQueryBuilder["execute"]>, TResult2 = never>(
    onfulfilled?:
      ((value: ReturnType<MockQueryBuilder["execute"]>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return Promise.resolve(this.execute()).then(onfulfilled, onrejected);
  }
}

export function createMockSupabaseClient(): SupabaseClient<Database> {
  const client = {
    from(table: string) {
      return new MockQueryBuilder(table);
    },
    async rpc(fn: string, params?: Row) {
      ensureHydrated();
      if (fn === "update_order_status" && params) {
        const orderId = params["p_order_id"];
        const status = params["p_status"];
        const orders = getTableRows("orders");
        const order = orders.find((entry) => entry["id"] === orderId);
        if (order && typeof status === "string") {
          order["status"] = status;
          order["updated_at"] = new Date().toISOString();
          persistStore();
        }
        return { data: null, error: null };
      }

      if (fn === "adjust_product_inventory" && params) {
        const productId = params["p_product_id"];
        const variantId = params["p_variant_id"];
        const action = params["p_action"];
        const quantity = params["p_quantity"];
        const reason = params["p_reason"];
        if (
          typeof productId !== "string" ||
          typeof variantId !== "string" ||
          typeof action !== "string" ||
          typeof quantity !== "number" ||
          typeof reason !== "string"
        ) {
          return { data: [], error: { message: "Invalid inventory adjustment parameters" } };
        }
        const products = getTableRows("products");
        const product = products.find((entry) => entry["id"] === productId);
        if (!product || product["is_demo"] === true) {
          return { data: [], error: null };
        }
        const stockMap =
          product["stock_by_variant"] &&
          typeof product["stock_by_variant"] === "object" &&
          !Array.isArray(product["stock_by_variant"])
            ? ({ ...(product["stock_by_variant"] as Record<string, number>) } as Record<
                string,
                number
              >)
            : {};
        const previousQuantity =
          typeof stockMap[variantId] === "number" ? stockMap[variantId] : null;
        let newQuantity = quantity;
        if (action === "increment") {
          if (previousQuantity === null) return { data: [], error: null };
          newQuantity = previousQuantity + quantity;
        } else if (action === "decrement") {
          if (previousQuantity === null || quantity > previousQuantity) {
            return { data: [], error: null };
          }
          newQuantity = previousQuantity - quantity;
        }
        stockMap[variantId] = newQuantity;
        product["stock_by_variant"] = stockMap;
        product["updated_at"] = new Date().toISOString();

        const adjustment: Row = {
          id: crypto.randomUUID(),
          product_id: productId,
          variant_id: variantId,
          previous_quantity: previousQuantity,
          new_quantity: newQuantity,
          action,
          adjustment_amount: quantity,
          reason,
          changed_by: memoryStore.currentSession?.user.id ?? null,
          created_at: new Date().toISOString(),
        };
        getTableRows("inventory_adjustments").push(adjustment);
        persistStore();
        return { data: [cloneRow(adjustment)], error: null };
      }

      return { data: null, error: null };
    },
    auth: {
      async getUser() {
        ensureHydrated();
        return { data: { user: memoryStore.currentSession?.user ?? null }, error: null };
      },
      async getSession() {
        ensureHydrated();
        return { data: { session: memoryStore.currentSession }, error: null };
      },
      onAuthStateChange(callback: AuthListener) {
        authListeners.add(callback);
        return {
          data: {
            subscription: {
              unsubscribe() {
                authListeners.delete(callback);
              },
            },
          },
        };
      },
      async signInWithPassword({ email, password }: { email: string; password: string }) {
        ensureHydrated();
        const account = memoryStore.accounts[email.toLowerCase()];
        if (!account || account.password !== password) {
          return {
            data: { user: null, session: null },
            error: { message: "Invalid login credentials", name: "AuthApiError" },
          };
        }
        const session: Session = {
          access_token: `local-token-${account.user.id}`,
          refresh_token: `local-refresh-${account.user.id}`,
          expires_in: 3600,
          token_type: "bearer",
          user: account.user,
        };
        memoryStore.currentSession = session;
        persistStore();
        notifyAuthListeners("SIGNED_IN", session);
        return { data: { user: account.user, session }, error: null };
      },
      async signUp({
        email,
        password,
        options,
      }: {
        email: string;
        password: string;
        options?: { data?: Record<string, unknown> };
      }) {
        ensureHydrated();
        const key = email.toLowerCase();
        if (memoryStore.accounts[key]) {
          return {
            data: { user: null, session: null },
            error: { message: "User already registered", name: "AuthApiError" },
          };
        }
        const user: User = {
          id: crypto.randomUUID(),
          app_metadata: {},
          user_metadata: options?.data ?? {},
          aud: "authenticated",
          email,
          created_at: new Date().toISOString(),
        };
        memoryStore.accounts[key] = { user, password };

        // In local secret-free mode, grant Store Studio access to the first account created
        const roles = getTableRows("user_roles");
        if (roles.length === 0) {
          roles.push({
            id: crypto.randomUUID(),
            user_id: user.id,
            role: "admin",
            created_at: new Date().toISOString(),
          });
        }

        const session: Session = {
          access_token: `local-token-${user.id}`,
          refresh_token: `local-refresh-${user.id}`,
          expires_in: 3600,
          token_type: "bearer",
          user,
        };
        memoryStore.currentSession = session;
        persistStore();
        notifyAuthListeners("SIGNED_IN", session);
        return { data: { user, session }, error: null };
      },
      async signOut() {
        ensureHydrated();
        memoryStore.currentSession = null;
        persistStore();
        notifyAuthListeners("SIGNED_OUT", null);
        return { error: null };
      },
      async setSession(tokens: { access_token: string; refresh_token: string }) {
        ensureHydrated();
        if (memoryStore.currentSession) {
          memoryStore.currentSession = { ...memoryStore.currentSession, ...tokens };
          persistStore();
        }
        return {
          data: {
            user: memoryStore.currentSession?.user ?? null,
            session: memoryStore.currentSession,
          },
          error: null,
        };
      },
      async updateUser({ data }: { data?: Record<string, unknown> }) {
        ensureHydrated();
        if (!memoryStore.currentSession) {
          return { data: { user: null }, error: { message: "Not authenticated" } };
        }
        const updatedUser: User = {
          ...memoryStore.currentSession.user,
          user_metadata: { ...memoryStore.currentSession.user.user_metadata, ...(data ?? {}) },
        };
        memoryStore.currentSession = { ...memoryStore.currentSession, user: updatedUser };
        if (updatedUser.email) {
          const existing = memoryStore.accounts[updatedUser.email.toLowerCase()];
          if (existing) {
            existing.user = updatedUser;
          }
        }
        persistStore();
        notifyAuthListeners("USER_UPDATED", memoryStore.currentSession);
        return { data: { user: updatedUser }, error: null };
      },
      async getClaims() {
        return { data: { claims: null }, error: { message: "Local auth active" } };
      },
    },
  };

  return client as unknown as SupabaseClient<Database>;
}
