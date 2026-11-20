import { describe, expect, it } from "vitest";

import { calculateCartSubtotal, getInventoryStatus, isPurchasableProduct } from "@/lib/store-domain";

describe("inventory status", () => {
  it("classifies counts at the five-unit low-stock threshold", () => {
    expect(getInventoryStatus(undefined, 5)).toBe("untracked");
    expect(getInventoryStatus(0, 5)).toBe("out_of_stock");
    expect(getInventoryStatus(1, 5)).toBe("low_stock");
    expect(getInventoryStatus(5, 5)).toBe("low_stock");
    expect(getInventoryStatus(6, 5)).toBe("in_stock");
  });
});

describe("store product availability", () => {
  it("never permits development demos to be purchased, even if their other flags are enabled", () => {
    expect(
      isPurchasableProduct({ is_active: true, is_published: true, is_demo: true, purchase_available: true }),
    ).toBe(false);
  });

  it("counts only published, active, purchasable items in the cart subtotal", () => {
    const product = {
      id: "published-product",
      is_active: true,
      is_published: true,
      is_demo: false,
      purchase_available: true,
      variants: [{ id: "30ml", label: "30 ml", price: 68 }],
    };
    expect(
      calculateCartSubtotal(
        [{ productId: "published-product", variantId: "30ml", quantity: 2 }],
        [product as never],
      ),
    ).toBe(136);
    expect(
      calculateCartSubtotal(
        [{ productId: "demo", variantId: "30ml", quantity: 1 }],
        [{ ...product, id: "demo", is_demo: true } as never],
      ),
    ).toBe(0);
  });
});