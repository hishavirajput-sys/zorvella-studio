import type { WebVitalSample } from "./web-vitals";

const MAX_VITALS_SAMPLES = 5000;
const VALID_METRICS = new Set(["LCP", "INP", "CLS"]);
const VALID_DEVICES = new Set(["mobile", "tablet", "desktop"]);
const VALID_RATINGS = new Set(["good", "needs-improvement", "poor"]);

const samplesBuffer: WebVitalSample[] = [];
let hydrated = false;
let hydratePromise: Promise<void> | null = null;
let diskWriteDisabled = false;
let writeQueue: Promise<void> = Promise.resolve();

const forwardStats = {
  succeeded: 0,
  failed: 0,
  lastError: null as string | null,
  lastFailureAt: null as number | null,
};

function isNodeRuntime(): boolean {
  return typeof process !== "undefined" && Boolean(process.versions?.node);
}

function resolveStorePath(): string | null {
  if (!isNodeRuntime() || diskWriteDisabled) return null;
  const configured = process.env["WEB_VITALS_STORE_PATH"]?.trim();
  if (configured === "disabled" || configured === "memory") return null;
  return configured && configured.length > 0 ? configured : ".data/web-vitals.ndjson";
}

function isValidStoredSample(raw: unknown): raw is WebVitalSample {
  if (!raw || typeof raw !== "object") return false;
  const item = raw as Partial<WebVitalSample>;
  return (
    typeof item.metric === "string" &&
    VALID_METRICS.has(item.metric) &&
    typeof item.value === "number" &&
    Number.isFinite(item.value) &&
    item.value >= 0 &&
    typeof item.route === "string" &&
    typeof item.device === "string" &&
    VALID_DEVICES.has(item.device) &&
    typeof item.rating === "string" &&
    VALID_RATINGS.has(item.rating) &&
    typeof item.connection === "string" &&
    typeof item.timestamp === "number" &&
    Number.isFinite(item.timestamp)
  );
}

export async function ensureVitalsHydrated(): Promise<void> {
  if (hydrated) return;
  if (hydratePromise) return hydratePromise;

  hydratePromise = (async () => {
    const storePath = resolveStorePath();
    if (!storePath) {
      hydrated = true;
      return;
    }
    try {
      const fs = await import("node:fs/promises");
      const content = await fs.readFile(storePath, "utf8");
      const lines = content.split("\n");
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const parsed = JSON.parse(trimmed) as unknown;
          if (isValidStoredSample(parsed)) {
            samplesBuffer.push(parsed);
          }
        } catch {
          // Skip malformed trailing line cleanly
        }
      }
      if (samplesBuffer.length > MAX_VITALS_SAMPLES) {
        samplesBuffer.splice(0, samplesBuffer.length - MAX_VITALS_SAMPLES);
      }
    } catch (error) {
      const code = (error as NodeJS.ErrnoException)?.code;
      if (code !== "ENOENT") {
        console.error("[web-vitals] Failed to hydrate persisted telemetry store:", error);
      }
    } finally {
      hydrated = true;
    }
  })();

  return hydratePromise;
}

async function persistSampleToDisk(sample: WebVitalSample): Promise<void> {
  const storePath = resolveStorePath();
  if (!storePath) return;

  writeQueue = writeQueue
    .then(async () => {
      const fs = await import("node:fs/promises");
      const path = await import("node:path");
      const resolved = path.resolve(storePath);
      await fs.mkdir(path.dirname(resolved), { recursive: true });
      if (samplesBuffer.length >= MAX_VITALS_SAMPLES) {
        const snapshot = `${samplesBuffer.map((entry) => JSON.stringify(entry)).join("\n")}\n`;
        await fs.writeFile(resolved, snapshot, "utf8");
      } else {
        await fs.appendFile(resolved, `${JSON.stringify(sample)}\n`, "utf8");
      }
    })
    .catch((error) => {
      const code = (error as NodeJS.ErrnoException)?.code;
      if (code === "EROFS" || code === "EACCES" || code === "EPERM") {
        diskWriteDisabled = true;
        return;
      }
      console.error("[web-vitals] Failed to persist sample to disk:", error);
    });

  await writeQueue;
}

export type ForwardResult = {
  forwarded: boolean;
  ok: boolean;
  upstreamStatus?: number;
  error?: string;
};

async function forwardSampleToCollector(sample: WebVitalSample): Promise<ForwardResult> {
  const forwardUrl = process.env["WEB_VITALS_FORWARD_URL"]?.trim();
  if (!forwardUrl) {
    return { forwarded: false, ok: true };
  }

  try {
    const parsedUrl = new URL(forwardUrl);
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      throw new Error(`Unsupported WEB_VITALS_FORWARD_URL protocol: ${parsedUrl.protocol}`);
    }

    const headers: Record<string, string> = {
      "content-type": "application/json",
    };
    const token = process.env["WEB_VITALS_FORWARD_TOKEN"]?.trim();
    if (token) {
      headers["authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(parsedUrl.toString(), {
      method: "POST",
      headers,
      body: JSON.stringify(sample),
      signal: AbortSignal.timeout(4000),
    });

    if (!response.ok) {
      const msg = `Collector responded with HTTP ${response.status}`;
      forwardStats.failed += 1;
      forwardStats.lastError = msg;
      forwardStats.lastFailureAt = Date.now();
      console.error(`[web-vitals] Forwarding failed (${parsedUrl.origin}): ${msg}`);
      return { forwarded: true, ok: false, upstreamStatus: response.status, error: msg };
    }

    forwardStats.succeeded += 1;
    return { forwarded: true, ok: true, upstreamStatus: response.status };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    forwardStats.failed += 1;
    forwardStats.lastError = msg;
    forwardStats.lastFailureAt = Date.now();
    console.error(`[web-vitals] Forwarding error: ${msg}`);
    return { forwarded: true, ok: false, error: msg };
  }
}

export async function recordWebVitalSample(sample: WebVitalSample): Promise<ForwardResult> {
  await ensureVitalsHydrated();
  samplesBuffer.push(sample);
  if (samplesBuffer.length > MAX_VITALS_SAMPLES) {
    samplesBuffer.shift();
  }
  await persistSampleToDisk(sample);
  return forwardSampleToCollector(sample);
}

function computeP75(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.75) - 1);
  return sorted[idx] ?? null;
}

export async function getVitalsSnapshot() {
  await ensureVitalsHydrated();

  const groups = new Map<
    string,
    { route: string; device: string; LCP: number[]; INP: number[]; CLS: number[] }
  >();
  for (const sample of samplesBuffer) {
    const key = `${sample.route}::${sample.device}`;
    let bucket = groups.get(key);
    if (!bucket) {
      bucket = { route: sample.route, device: sample.device, LCP: [], INP: [], CLS: [] };
      groups.set(key, bucket);
    }
    bucket[sample.metric].push(sample.value);
  }

  const storePath = resolveStorePath();
  const forwardUrl = process.env["WEB_VITALS_FORWARD_URL"]?.trim();
  const forwardConfigured = Boolean(forwardUrl);

  return {
    totalSamples: samplesBuffer.length,
    persistence: {
      mode: forwardConfigured ? (storePath ? "remote-collector+file" : "remote-collector") : storePath ? "file" : "memory",
      durable: Boolean(forwardConfigured || storePath),
      sharedAcrossInstances: forwardConfigured,
      storagePath: storePath,
      forwardConfigured,
      forwardStats: { ...forwardStats },
    },
    summary: [...groups.values()].map((group) => ({
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
    })),
  };
}
