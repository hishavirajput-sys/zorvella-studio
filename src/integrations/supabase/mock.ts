import type { AuthChangeEvent, Session, SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "./types";

type Row = Record<string, unknown>;

type AuthListener = (event: AuthChangeEvent, session: Session | null) => void;

type MockAccount = {
  user: User;
  password: string;
};

const tables = new Map<string, Row[]>();
const accounts = new Map<string, MockAccount>();
const authListeners = new Set<AuthListener>();

let currentSession: Session | null = null;

function getTableRows(table: string): Row[] {
  let rows = tables.get(table);
  if (!rows) {
    rows = [];
    tables.set(table, rows);
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
      // Ignore listener errors in mock auth notifications
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

class MockQueryBuilder implements PromiseLike<{
  data: unknown;
  error: { message: string } | null;
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

    if (this.mode === "insert") {
      const items = Array.isArray(this.payload) ? this.payload : [this.payload];
      const inserted = items.map((item) => {
        const record = { ...(item as Row) };
        if (typeof record["id"] !== "string") {
          record["id"] = crypto.randomUUID();
        }
        if (typeof record["created_at"] !== "string") {
          record["created_at"] = now;
        }
        if (typeof record["updated_at"] !== "string") {
          record["updated_at"] = now;
        }
        tableRows.push(record);
        return cloneRow(record);
      });
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
      if (this.singleMode !== "none") {
        return makeQueryResult(upserted[0] ?? null);
      }
      return makeQueryResult(upserted);
    }

    if (this.mode === "update") {
      const patch = (this.payload ?? {}) as Row;
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
        return {
          data: null,
          error: { message: "Row not found" },
          count: this.countMode ? totalCount : null,
          status: 406,
          statusText: "Not Acceptable",
        };
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
      if (fn === "update_order_status" && params) {
        const orderId = params["p_order_id"];
        const status = params["p_status"];
        const orders = getTableRows("orders");
        const order = orders.find((entry) => entry["id"] === orderId);
        if (order && typeof status === "string") {
          order["status"] = status;
          order["updated_at"] = new Date().toISOString();
        }
      }
      return { data: null, error: null };
    },
    auth: {
      async getUser() {
        return { data: { user: currentSession?.user ?? null }, error: null };
      },
      async getSession() {
        return { data: { session: currentSession }, error: null };
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
        const account = accounts.get(email.toLowerCase());
        if (!account || account.password !== password) {
          return {
            data: { user: null, session: null },
            error: { message: "Invalid login credentials", name: "AuthApiError" },
          };
        }
        const session: Session = {
          access_token: `mock-token-${account.user.id}`,
          refresh_token: `mock-refresh-${account.user.id}`,
          expires_in: 3600,
          token_type: "bearer",
          user: account.user,
        };
        currentSession = session;
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
        const key = email.toLowerCase();
        if (accounts.has(key)) {
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
        accounts.set(key, { user, password });
        const session: Session = {
          access_token: `mock-token-${user.id}`,
          refresh_token: `mock-refresh-${user.id}`,
          expires_in: 3600,
          token_type: "bearer",
          user,
        };
        currentSession = session;
        notifyAuthListeners("SIGNED_IN", session);
        return { data: { user, session }, error: null };
      },
      async signOut() {
        currentSession = null;
        notifyAuthListeners("SIGNED_OUT", null);
        return { error: null };
      },
      async setSession(tokens: { access_token: string; refresh_token: string }) {
        if (currentSession) {
          currentSession = { ...currentSession, ...tokens };
        }
        return {
          data: { user: currentSession?.user ?? null, session: currentSession },
          error: null,
        };
      },
      async updateUser({ data }: { data?: Record<string, unknown> }) {
        if (!currentSession) {
          return { data: { user: null }, error: { message: "Not authenticated" } };
        }
        const updatedUser: User = {
          ...currentSession.user,
          user_metadata: { ...currentSession.user.user_metadata, ...(data ?? {}) },
        };
        currentSession = { ...currentSession, user: updatedUser };
        if (updatedUser.email) {
          const existing = accounts.get(updatedUser.email.toLowerCase());
          if (existing) {
            existing.user = updatedUser;
          }
        }
        notifyAuthListeners("USER_UPDATED", currentSession);
        return { data: { user: updatedUser }, error: null };
      },
      async getClaims() {
        return { data: { claims: null }, error: { message: "Mock auth active" } };
      },
    },
  };

  return client as unknown as SupabaseClient<Database>;
}
