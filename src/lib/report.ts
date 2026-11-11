import type { LhAudit, LhCategory, PsiResponse } from "@/api/pagespeed";
import { formatBytes, formatMs, METRIC_NAMES, metricStatus } from "@/lib/metrics";
import type {
  AuditItem,
  Lang,
  Metric,
  MetricKey,
  Opportunity,
  Report,
  Status,
  StrategyReport,
} from "@/types";

/** Chrome UX Report (real users) metric ids. */
const FIELD_KEYS: Partial<Record<MetricKey, string>> = {
  LCP: "LARGEST_CONTENTFUL_PAINT_MS",
  INP: "INTERACTION_TO_NEXT_PAINT",
  CLS: "CUMULATIVE_LAYOUT_SHIFT_SCORE",
  FCP: "FIRST_CONTENTFUL_PAINT_MS",
  TTFB: "EXPERIMENTAL_TIME_TO_FIRST_BYTE",
};

/** Lighthouse (lab) audit ids. INP can't be measured in the lab. */
const LAB_KEYS: Partial<Record<MetricKey, string>> = {
  LCP: "largest-contentful-paint",
  CLS: "cumulative-layout-shift",
  FCP: "first-contentful-paint",
  TTFB: "server-response-time",
  TBT: "total-blocking-time",
};

const METRIC_ORDER: MetricKey[] = ["LCP", "INP", "CLS", "FCP", "TTFB", "TBT"];
const SKIPPED_MODES = new Set(["notApplicable", "manual", "informative", "error"]);
const STATUS_ORDER: Record<Status, number> = { poor: 0, warning: 1, good: 2 };

const toScore = (category?: LhCategory) => Math.round((category?.score ?? 0) * 100);

function buildMetric(key: MetricKey, raw: PsiResponse): Metric {
  const crux = raw.loadingExperience?.metrics ?? raw.originLoadingExperience?.metrics;
  const fieldKey = FIELD_KEYS[key];
  const field = fieldKey ? crux?.[fieldKey] : undefined;

  if (field && typeof field.percentile === "number") {
    // CrUX reports CLS multiplied by 100.
    const value = key === "CLS" ? field.percentile / 100 : field.percentile;
    return { key, name: METRIC_NAMES[key], value, source: "field", status: metricStatus(key, value) };
  }

  const labKey = LAB_KEYS[key];
  const audit = labKey ? raw.lighthouseResult.audits[labKey] : undefined;
  if (typeof audit?.numericValue === "number") {
    const value = audit.numericValue;
    return { key, name: METRIC_NAMES[key], value, source: "lab", status: metricStatus(key, value) };
  }

  return { key, name: METRIC_NAMES[key], value: null, source: null, status: null };
}

function auditStatus(score: number, minor: boolean): Status {
  if (score >= 0.9) return "good";
  if (score >= 0.5 || minor) return "warning";
  return "poor";
}

/** Collects scored audits of a category (SEO, accessibility). */
function categoryAudits(
  category: LhCategory | undefined,
  audits: Record<string, LhAudit | undefined>,
  minorWeight: number,
): AuditItem[] {
  if (!category) return [];
  const items: AuditItem[] = [];

  for (const ref of category.auditRefs) {
    const audit = audits[ref.id];
    if (!audit || audit.score === null || SKIPPED_MODES.has(audit.scoreDisplayMode)) continue;
    items.push({
      id: audit.id,
      title: audit.title,
      description: audit.description,
      display: audit.displayValue ?? "",
      status: auditStatus(audit.score, ref.weight <= minorWeight),
    });
  }

  return items.sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
}

function savingsMs(audit: LhAudit): number {
  if (audit.details?.overallSavingsMs) return audit.details.overallSavingsMs;
  const s = audit.metricSavings ?? {};
  return (s.LCP ?? 0) + (s.FCP ?? 0) + (s.TBT ?? 0) + (s.INP ?? 0);
}

function savingsLabel(audit: LhAudit): string {
  const ms = audit.details?.overallSavingsMs ?? 0;
  const bytes = audit.details?.overallSavingsBytes ?? 0;
  if (ms > 0) return formatMs(ms);
  if (bytes > 0) return formatBytes(bytes);
  return audit.displayValue ?? "";
}

/** Failed performance audits, sorted by their potential impact. */
function performanceOpportunities(raw: PsiResponse): Opportunity[] {
  const { categories, audits } = raw.lighthouseResult;
  const refs = (categories.performance?.auditRefs ?? []).filter((ref) => ref.group !== "metrics");

  const collect = (includeHidden: boolean) =>
    refs
      .filter((ref) => includeHidden || ref.group !== "hidden")
      .map((ref) => audits[ref.id])
      .filter(
        (audit): audit is LhAudit =>
          !!audit &&
          audit.score !== null &&
          audit.score < 0.9 &&
          !SKIPPED_MODES.has(audit.scoreDisplayMode),
      );

  let failed = collect(false);
  if (failed.length === 0) failed = collect(true);

  const seen = new Set<string>();
  return failed
    .sort((a, b) => savingsMs(b) - savingsMs(a) || (a.score ?? 0) - (b.score ?? 0))
    .filter((audit) => !seen.has(audit.title) && !!seen.add(audit.title))
    .map((audit) => ({
      id: audit.id,
      title: audit.title,
      description: audit.description,
      display: audit.displayValue ?? "",
      savings: savingsLabel(audit),
      status: (audit.score ?? 0) < 0.5 ? "poor" : "warning",
    }));
}

export function buildStrategyReport(raw: PsiResponse): StrategyReport {
  const { categories, audits } = raw.lighthouseResult;
  const metrics = METRIC_ORDER.map((key) => buildMetric(key, raw));

  return {
    scores: {
      performance: toScore(categories.performance),
      seo: toScore(categories.seo),
      accessibility: toScore(categories.accessibility),
    },
    metrics,
    hasFieldData: metrics.some((m) => m.source === "field"),
    speedIndex: audits["speed-index"]?.numericValue ?? null,
    pageWeight: audits["total-byte-weight"]?.numericValue ?? null,
    opportunities: performanceOpportunities(raw),
    seoAudits: categoryAudits(categories.seo, audits, 0),
    accessibilityAudits: categoryAudits(categories.accessibility, audits, 3),
  };
}

export function buildReport(
  url: string,
  lang: Lang,
  desktop: PsiResponse,
  mobile: PsiResponse,
): Report {
  const lh = mobile.lighthouseResult;
  return {
    version: 1,
    id: `${Date.now()}`,
    url,
    finalUrl: lh.finalDisplayedUrl ?? lh.finalUrl ?? url,
    analyzedAt: new Date().toISOString(),
    lang,
    desktop: buildStrategyReport(desktop),
    mobile: buildStrategyReport(mobile),
  };
}

/** Core Web Vitals assessment based on real-user data (LCP, INP, CLS). */
export function cwvAssessment(report: StrategyReport) {
  const core = report.metrics.filter(
    (m) => ["LCP", "INP", "CLS"].includes(m.key) && m.source === "field",
  );
  return {
    total: core.length,
    passed: core.filter((m) => m.status === "good").length,
  };
}

/** Adds https:// when missing and validates the address. Returns null if invalid. */
export function normalizeUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withProtocol);
    if (!url.hostname.includes(".")) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export const hostname = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};
