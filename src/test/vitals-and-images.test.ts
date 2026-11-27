import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import { buildMediaSrcSet, resolveResponsiveMedia } from "@/lib/responsive-images";

describe("Responsive storefront media manifest", () => {
  it("resolves editorial and product JPEGs and step WebPs to AVIF/WebP responsive sources", () => {
    const product = resolveResponsiveMedia("/site-assets/generated/product_barrier_serum_1795670125183.jpg");
    expect(product).not.toBeNull();
    expect(product?.width).toBe(1200);
    expect(product?.height).toBe(896);
    expect(buildMediaSrcSet(product!, "avif")).toContain("480w.avif 480w");
    expect(buildMediaSrcSet(product!, "webp")).toContain("800w.webp 800w");

    const step = resolveResponsiveMedia("/site-assets/home/step-cleanse.webp");
    expect(step).not.toBeNull();
    expect(step?.width).toBe(960);
    expect(step?.height).toBe(640);
  });
});

describe("Durable Web Vitals telemetry store", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "zorvellae-vitals-"));
  const storePath = path.join(tmpDir, "vitals.ndjson");

  afterEach(() => {
    delete process.env["WEB_VITALS_STORE_PATH"];
    delete process.env["WEB_VITALS_FORWARD_URL"];
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("persists samples across module restarts and reports upstream forwarding failures", async () => {
    process.env["WEB_VITALS_STORE_PATH"] = storePath;
    process.env["WEB_VITALS_FORWARD_URL"] = "https://collector.example.test/vitals";

    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("upstream unavailable", { status: 503 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    const store1 = await import("@/lib/vitals-store");
    const failedResult = await store1.recordWebVitalSample({
      metric: "LCP",
      value: 1420,
      rating: "good",
      route: "/",
      device: "mobile",
      connection: "4g",
      timestamp: 1700000000000,
    });

    expect(failedResult.forwarded).toBe(true);
    expect(failedResult.ok).toBe(false);
    expect(failedResult.upstreamStatus).toBe(503);
    expect(consoleErrorSpy).toHaveBeenCalled();

    const okResult = await store1.recordWebVitalSample({
      metric: "LCP",
      value: 1180,
      rating: "good",
      route: "/",
      device: "mobile",
      connection: "4g",
      timestamp: 1700000001000,
    });
    expect(okResult.ok).toBe(true);

    // Simulate process restart by resetting modules and reading back from NDJSON store
    vi.resetModules();
    const store2 = await import("@/lib/vitals-store");
    const snapshot = await store2.getVitalsSnapshot();
    expect(snapshot.totalSamples).toBe(2);
    expect(snapshot.persistence.durable).toBe(true);
    expect(snapshot.summary[0]?.p75.LCP).toBe(1420);
  });

  it("works cleanly without WEB_VITALS_* or VITE_WEB_VITALS_* environment variables configured", async () => {
    delete process.env["WEB_VITALS_STORE_PATH"];
    delete process.env["WEB_VITALS_FORWARD_URL"];
    delete process.env["WEB_VITALS_FORWARD_TOKEN"];

    const store = await import("@/lib/vitals-store");
    const result = await store.recordWebVitalSample({
      metric: "CLS",
      value: 0.02,
      rating: "good",
      route: "/",
      device: "desktop",
      connection: "4g",
      timestamp: 1700000002000,
    });

    expect(result).toEqual({ forwarded: false, ok: true });
    const snapshot = await store.getVitalsSnapshot();
    expect(snapshot.persistence.forwardConfigured).toBe(false);
    expect(snapshot.totalSamples).toBeGreaterThanOrEqual(1);
    fs.rmSync(path.resolve(".data/web-vitals.ndjson"), { force: true });
  });
});
