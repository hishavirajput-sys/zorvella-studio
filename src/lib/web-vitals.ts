export type VitalMetricName = "LCP" | "INP" | "CLS";
export type VitalRating = "good" | "needs-improvement" | "poor";
export type VitalDeviceType = "mobile" | "tablet" | "desktop";

export interface WebVitalSample {
  metric: VitalMetricName;
  value: number;
  rating: VitalRating;
  route: string;
  device: VitalDeviceType;
  connection: string;
  timestamp: number;
}

const DEFAULT_ENDPOINT = "/api/vitals";

function getEndpoint(): string {
  const configured = import.meta.env["VITE_WEB_VITALS_ENDPOINT"];
  if (typeof configured === "string" && configured.trim().length > 0) {
    return configured.trim();
  }
  return DEFAULT_ENDPOINT;
}

function getDeviceType(): VitalDeviceType {
  if (typeof window === "undefined") return "desktop";
  if (window.innerWidth < 640) return "mobile";
  if (window.innerWidth < 1024) return "tablet";
  return "desktop";
}

function getConnectionType(): string {
  if (typeof navigator === "undefined") return "unknown";
  const nav = navigator as Navigator & {
    connection?: { effectiveType?: string };
  };
  return nav.connection?.effectiveType ?? "unknown";
}

function getRating(metric: VitalMetricName, value: number): VitalRating {
  if (metric === "LCP") {
    if (value <= 2500) return "good";
    return value <= 4000 ? "needs-improvement" : "poor";
  }
  if (metric === "INP") {
    if (value <= 200) return "good";
    return value <= 500 ? "needs-improvement" : "poor";
  }
  if (value <= 0.1) return "good";
  return value <= 0.25 ? "needs-improvement" : "poor";
}

function normalizeValue(metric: VitalMetricName, value: number): number {
  if (metric === "CLS") return Math.round(value * 10000) / 10000;
  return Math.round(value);
}

function sendSample(sample: WebVitalSample) {
  const endpoint = getEndpoint();
  const payload = JSON.stringify(sample);

  try {
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([payload], { type: "application/json" });
      if (navigator.sendBeacon(endpoint, blob)) return;
    }
    void fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: payload,
      keepalive: true,
    });
  } catch {
    // Non-blocking telemetry: ignore transport failures silently.
  }
}

let initialized = false;

export function initWebVitalsReporting(): () => void {
  if (initialized || typeof window === "undefined" || typeof PerformanceObserver === "undefined") {
    return () => {};
  }
  initialized = true;

  let latestLcp: number | null = null;
  let lcpRoute = window.location.pathname || "/";
  let clsSessionValue = 0;
  let clsSessionEntries: number[] = [];
  let clsMaxValue = 0;
  let lastClsTime = 0;
  let clsRoute = window.location.pathname || "/";

  const interactionMap = new Map<number, number>();
  let inpRoute = window.location.pathname || "/";

  const flushed = new Set<string>();

  const emitMetric = (metric: VitalMetricName, rawValue: number, route: string) => {
    const key = `${route}:${metric}`;
    if (flushed.has(key)) return;
    flushed.add(key);

    const value = normalizeValue(metric, rawValue);
    sendSample({
      metric,
      value,
      rating: getRating(metric, value),
      route,
      device: getDeviceType(),
      connection: getConnectionType(),
      timestamp: Date.now(),
    });
  };

  const observers: PerformanceObserver[] = [];

  if (PerformanceObserver.supportedEntryTypes?.includes("largest-contentful-paint")) {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1];
      if (last) {
        latestLcp = last.startTime;
        lcpRoute = window.location.pathname || "/";
      }
    });
    lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });
    observers.push(lcpObserver);
  }

  if (PerformanceObserver.supportedEntryTypes?.includes("layout-shift")) {
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const shift = entry as PerformanceEntry & { value?: number; hadRecentInput?: boolean };
        if (shift.hadRecentInput || typeof shift.value !== "number") continue;

        const firstEntry = clsSessionEntries[0];
        if (
          clsSessionEntries.length > 0 &&
          entry.startTime - lastClsTime < 1000 &&
          firstEntry !== undefined &&
          entry.startTime - firstEntry < 5000
        ) {
          clsSessionValue += shift.value;
          clsSessionEntries.push(entry.startTime);
        } else {
          clsSessionValue = shift.value;
          clsSessionEntries = [entry.startTime];
        }
        lastClsTime = entry.startTime;
        if (clsSessionValue > clsMaxValue) {
          clsMaxValue = clsSessionValue;
          clsRoute = window.location.pathname || "/";
        }
      }
    });
    clsObserver.observe({ type: "layout-shift", buffered: true });
    observers.push(clsObserver);
  }

  if (PerformanceObserver.supportedEntryTypes?.includes("event")) {
    const inpObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const evt = entry as PerformanceEntry & { interactionId?: number };
        if (!evt.interactionId) continue;
        const prev = interactionMap.get(evt.interactionId) ?? 0;
        if (evt.duration > prev) {
          interactionMap.set(evt.interactionId, evt.duration);
          inpRoute = window.location.pathname || "/";
        }
      }
    });
    try {
      inpObserver.observe({
        type: "event",
        buffered: true,
        durationThreshold: 16,
      } as PerformanceObserverInit);
      observers.push(inpObserver);
    } catch {
      // Some environments do not support durationThreshold on event observer.
    }
  }

  const flushAll = () => {
    if (latestLcp !== null) {
      emitMetric("LCP", latestLcp, lcpRoute);
    }
    emitMetric("CLS", clsMaxValue, clsRoute);

    if (interactionMap.size > 0) {
      const sorted = [...interactionMap.values()].sort((a, b) => a - b);
      const p98Idx = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.98));
      const inpValue = sorted[p98Idx];
      if (typeof inpValue === "number") {
        emitMetric("INP", inpValue, inpRoute);
      }
    }
  };

  const onVisibilityChange = () => {
    if (document.visibilityState === "hidden") flushAll();
  };

  window.addEventListener("pagehide", flushAll);
  document.addEventListener("visibilitychange", onVisibilityChange);

  return () => {
    window.removeEventListener("pagehide", flushAll);
    document.removeEventListener("visibilitychange", onVisibilityChange);
    for (const observer of observers) observer.disconnect();
    initialized = false;
  };
}
