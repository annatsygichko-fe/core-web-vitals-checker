export type Lang = "uk" | "en";
export type Theme = "light" | "dark";
export type View = "landing" | "performance" | "seo" | "accessibility" | "history";
export type Status = "good" | "warning" | "poor";
export type Strategy = "desktop" | "mobile";

export type MetricKey = "LCP" | "INP" | "CLS" | "FCP" | "TTFB" | "TBT";

export interface Metric {
  key: MetricKey;
  name: string;
  /** Raw value: milliseconds for timings, unitless for CLS. */
  value: number | null;
  status: Status | null;
  /** "field" = real users (Chrome UX Report), "lab" = Lighthouse run. */
  source: "field" | "lab" | null;
}

export interface AuditItem {
  id: string;
  title: string;
  description: string;
  display: string;
  status: Status;
}

export interface Opportunity extends AuditItem {
  savings: string;
}

export interface StrategyReport {
  scores: { performance: number; seo: number; accessibility: number };
  metrics: Metric[];
  hasFieldData: boolean;
  speedIndex: number | null;
  pageWeight: number | null;
  opportunities: Opportunity[];
  seoAudits: AuditItem[];
  accessibilityAudits: AuditItem[];
}

export interface Report {
  version: 1;
  id: string;
  url: string;
  finalUrl: string;
  analyzedAt: string;
  lang: Lang;
  desktop: StrategyReport;
  mobile: StrategyReport;
}
