import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import type { WebVitalSample } from "./lib/web-vitals";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

const MAX_VITALS_SAMPLES = 2000;
const vitalsBuffer: WebVitalSample[] = [];
const VALID_METRICS = new Set(["LCP", "INP", "CLS"]);
const VALID_DEVICES = new Set(["mobile", "tablet", "desktop"]);
const VALID_RATINGS = new Set(["good", "needs-improvement", "poor"]);

function computeP75(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.75) - 1);
  return sorted[idx] ?? null;
}

function summarizeVitalsByRouteAndDevice() {
  const groups = new Map<string, { route: string; device: string; LCP: number[]; INP: number[]; CLS: number[] }>();
  for (const sample of vitalsBuffer) {
    const key = `${sample.route}::${sample.device}`;
    let bucket = groups.get(key);
    if (!bucket) {
      bucket = { route: sample.route, device: sample.device, LCP: [], INP: [], CLS: [] };
      groups.set(key, bucket);
    }
    bucket[sample.metric].push(sample.value);
  }
  return [...groups.values()].map((group) => ({
    route: group.route,
    device: group.device,
    samples: {
      LCP: group.LCP.length,
      INP: group.INP.length,
      CLS: group.CLS.length,
    },
    p75: {
      LCP: computeP75(group.LCP),
      INP: computeP75(group.INP),
      CLS: computeP75(group.CLS),
    },
  }));
}

async function handleVitalsRequest(request: Request): Promise<Response> {
  const noStoreHeaders = {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store, no-cache, must-revalidate",
  };

  if (request.method === "GET") {
    return new Response(
      JSON.stringify({
        totalSamples: vitalsBuffer.length,
        summary: summarizeVitalsByRouteAndDevice(),
      }),
      { status: 200, headers: noStoreHeaders },
    );
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: noStoreHeaders,
    });
  }

  try {
    const raw = (await request.json()) as Partial<WebVitalSample>;
    if (
      !raw ||
      typeof raw !== "object" ||
      typeof raw.metric !== "string" ||
      !VALID_METRICS.has(raw.metric) ||
      typeof raw.value !== "number" ||
      !Number.isFinite(raw.value) ||
      raw.value < 0 ||
      typeof raw.route !== "string"
    ) {
      return new Response(JSON.stringify({ error: "Invalid vital payload" }), {
        status: 400,
        headers: noStoreHeaders,
      });
    }

    const sanitized: WebVitalSample = {
      metric: raw.metric as WebVitalSample["metric"],
      value: raw.value,
      rating: typeof raw.rating === "string" && VALID_RATINGS.has(raw.rating) ? (raw.rating as WebVitalSample["rating"]) : "good",
      route: raw.route.slice(0, 120),
      device: typeof raw.device === "string" && VALID_DEVICES.has(raw.device) ? (raw.device as WebVitalSample["device"]) : "desktop",
      connection: typeof raw.connection === "string" ? raw.connection.slice(0, 24) : "unknown",
      timestamp: typeof raw.timestamp === "number" && Number.isFinite(raw.timestamp) ? raw.timestamp : Date.now(),
    };

    vitalsBuffer.push(sanitized);
    if (vitalsBuffer.length > MAX_VITALS_SAMPLES) {
      vitalsBuffer.shift();
    }

    const forwardUrl = process.env["WEB_VITALS_FORWARD_URL"]?.trim();
    if (forwardUrl) {
      void fetch(forwardUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(sanitized),
      }).catch(() => undefined);
    }

    return new Response(null, {
      status: 204,
      headers: { "cache-control": "no-store, no-cache, must-revalidate" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Malformed JSON payload" }), {
      status: 400,
      headers: noStoreHeaders,
    });
  }
}

function applyCacheHeaders(request: Request, response: Response): Response {
  const url = new URL(request.url);
  const headers = new Headers(response.headers);

  if (response.status >= 400 || url.pathname.startsWith("/api/")) {
    headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  } else if (url.pathname.startsWith("/assets/") || url.pathname.startsWith("/fonts/")) {
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
  } else if (
    url.pathname.startsWith("/site-assets/") ||
    url.pathname === "/favicon.ico" ||
    url.pathname === "/favicon-16x16.png" ||
    url.pathname === "/favicon-32x32.png" ||
    url.pathname === "/apple-touch-icon.png"
  ) {
    headers.set("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
  } else if ((headers.get("content-type") ?? "").includes("text/html")) {
    headers.set("Cache-Control", "public, max-age=0, must-revalidate");
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store, no-cache, must-revalidate",
    },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

// Hosting compresses every response at the edge. Never compress a body (gzip, brotli,
// CompressionStream) or set content-encoding here or in a server route: the body gets encoded
// twice and renders garbled.
export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const url = new URL(request.url);
      if (url.pathname === "/api/vitals") {
        return await handleVitalsRequest(request);
      }

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      const normalized = await normalizeCatastrophicSsrResponse(response);
      return applyCacheHeaders(request, normalized);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-store, no-cache, must-revalidate",
        },
      });
    }
  },
};
