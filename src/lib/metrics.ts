import type { MetricKey, Status } from "@/types";

/** Official "good" / "poor" boundaries (web.dev/articles/vitals). */
export const THRESHOLDS: Record<MetricKey, [good: number, poor: number]> = {
  LCP: [2500, 4000],
  INP: [200, 500],
  CLS: [0.1, 0.25],
  FCP: [1800, 3000],
  TTFB: [800, 1800],
  TBT: [200, 600],
};

export const METRIC_NAMES: Record<MetricKey, string> = {
  LCP: "Largest Contentful Paint",
  INP: "Interaction to Next Paint",
  CLS: "Cumulative Layout Shift",
  FCP: "First Contentful Paint",
  TTFB: "Time to First Byte",
  TBT: "Total Blocking Time",
};

export function metricStatus(key: MetricKey, value: number): Status {
  const [good, poor] = THRESHOLDS[key];
  if (value <= good) return "good";
  if (value <= poor) return "warning";
  return "poor";
}

export function formatMs(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)} s`;
  return `${Math.round(ms)} ms`;
}

export function formatMetric(key: MetricKey, value: number | null): string {
  if (value === null) return "—";
  if (key === "CLS") return value.toFixed(2);
  return formatMs(value);
}

export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

/** Lighthouse colour bands for 0–100 scores. */
export function scoreStatus(score: number): Status {
  if (score >= 90) return "good";
  if (score >= 50) return "warning";
  return "poor";
}

/**
 * Position of a value on the metric track (0–100 %).
 * The track spans from 0 to 125 % of the "poor" threshold.
 */
export function trackPosition(key: MetricKey, value: number): number {
  const max = THRESHOLDS[key][1] * 1.25;
  return Math.min(value / max, 1) * 100;
}
