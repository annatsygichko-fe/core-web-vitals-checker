import type { Lang, Strategy } from "@/types";

const ENDPOINT = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";
const API_KEY = import.meta.env.VITE_PSI_API_KEY;

/* ---------- Partial types of the PageSpeed Insights v5 response ---------- */

export interface LhAudit {
  id: string;
  title: string;
  description: string;
  score: number | null;
  scoreDisplayMode: string;
  displayValue?: string;
  numericValue?: number;
  metricSavings?: Record<string, number | undefined>;
  details?: {
    type?: string;
    overallSavingsMs?: number;
    overallSavingsBytes?: number;
  };
}

export interface LhCategory {
  score: number | null;
  auditRefs: { id: string; weight: number; group?: string }[];
}

export interface CruxMetric {
  percentile: number;
  category: "FAST" | "AVERAGE" | "SLOW";
}

export interface CruxData {
  metrics?: Record<string, CruxMetric | undefined>;
  overall_category?: string;
}

export interface PsiResponse {
  id: string;
  loadingExperience?: CruxData;
  originLoadingExperience?: CruxData;
  lighthouseResult: {
    finalUrl?: string;
    finalDisplayedUrl?: string;
    lighthouseVersion?: string;
    runtimeError?: { code: string; message: string };
    categories: Record<string, LhCategory | undefined>;
    audits: Record<string, LhAudit | undefined>;
  };
}

/* ---------- Errors ---------- */

export type PageSpeedErrorCode = "quota" | "unreachable" | "invalid" | "network" | "unknown";

export class PageSpeedError extends Error {
  readonly code: PageSpeedErrorCode;

  constructor(code: PageSpeedErrorCode, message: string) {
    super(message);
    this.name = "PageSpeedError";
    this.code = code;
  }
}

const UNREACHABLE_PATTERN =
  /FAILED_DOCUMENT_REQUEST|ERRORED_DOCUMENT_REQUEST|DNS_FAILURE|NO_FCP|NOT_HTML|unable to (resolve|reliably load)|status code: [45]\d\d/i;

function classifyError(status: number, message: string): PageSpeedErrorCode {
  if (status === 429) return "quota";
  if (UNREACHABLE_PATTERN.test(message)) return "unreachable";
  if (status === 400) return "invalid";
  return "unknown";
}

/* ---------- Request ---------- */

/**
 * Runs a Lighthouse analysis through the PageSpeed Insights API.
 * One request covers performance, SEO and accessibility for a single strategy.
 */
export async function runPageSpeed(
  url: string,
  strategy: Strategy,
  lang: Lang,
  signal?: AbortSignal,
): Promise<PsiResponse> {
  const params = new URLSearchParams({ url, strategy, locale: lang });
  for (const category of ["PERFORMANCE", "SEO", "ACCESSIBILITY"]) {
    params.append("category", category);
  }
  if (API_KEY) params.set("key", API_KEY);

  let response: Response;
  try {
    response = await fetch(`${ENDPOINT}?${params}`, { signal });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new PageSpeedError("network", (error as Error).message);
  }

  const data = (await response.json().catch(() => null)) as
    | (PsiResponse & { error?: { message?: string } })
    | null;

  if (!response.ok || !data) {
    const message = data?.error?.message ?? response.statusText;
    throw new PageSpeedError(classifyError(response.status, message), message);
  }

  const runtimeError = data.lighthouseResult?.runtimeError;
  if (runtimeError && runtimeError.code !== "NO_ERROR") {
    throw new PageSpeedError("unreachable", runtimeError.message);
  }

  return data;
}
