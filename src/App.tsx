import { useEffect, useRef, useState } from "react";
import { PageSpeedError, type PageSpeedErrorCode, runPageSpeed } from "@/api/pagespeed";
import { copy } from "@/i18n/copy";
import { clearHistory, loadHistory, readPreference, saveReport, writePreference } from "@/lib/history";
import { buildReport } from "@/lib/report";
import type { Lang, Report, Strategy, Theme, View } from "@/types";
import { Dashboard } from "@/views/Dashboard";
import { Landing } from "@/views/Landing";
import { LoadingScreen } from "@/views/LoadingScreen";

/** PageSpeed Insights usually answers in 15–60 s; give up after 2 minutes. */
const REQUEST_TIMEOUT_MS = 120_000;

export default function App() {
  const [lang, setLang] = useState<Lang>(() => readPreference("lang", ["uk", "en"] as const) ?? "uk");
  const [theme, setTheme] = useState<Theme>(
    () =>
      readPreference("theme", ["light", "dark"] as const) ??
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"),
  );
  const [view, setView] = useState<View>("landing");
  const [device, setDevice] = useState<Strategy>("mobile");
  const [history, setHistory] = useState<Report[]>(loadHistory);
  const [report, setReport] = useState<Report | null>(null);
  const [loadingUrl, setLoadingUrl] = useState<string | null>(null);
  const [lastUrl, setLastUrl] = useState("");
  const [error, setError] = useState<PageSpeedErrorCode | "timeout" | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const t = copy[lang];

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    writePreference("theme", theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = lang;
    writePreference("lang", lang);
  }, [lang]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const runAnalysis = async (url: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    let timedOut = false;
    const timer = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, REQUEST_TIMEOUT_MS);

    setError(null);
    setLastUrl(url);
    setLoadingUrl(url);

    try {
      // Desktop and mobile are separate Lighthouse runs, so start them in parallel.
      const [desktop, mobile] = await Promise.all([
        runPageSpeed(url, "desktop", lang, controller.signal),
        runPageSpeed(url, "mobile", lang, controller.signal),
      ]);
      const next = buildReport(url, lang, desktop, mobile);
      setReport(next);
      setHistory(saveReport(next));
      setView("performance");
      window.scrollTo(0, 0);
    } catch (e) {
      if (controller.signal.aborted && !timedOut) return; // cancelled by the user
      const code = timedOut ? "timeout" : e instanceof PageSpeedError ? e.code : "unknown";
      console.error("PageSpeed Insights request failed:", e);
      setError(code);
      setView("landing");
    } finally {
      window.clearTimeout(timer);
      if (abortRef.current === controller) {
        abortRef.current = null;
        setLoadingUrl(null);
      }
    }
  };

  const cancelAnalysis = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setLoadingUrl(null);
  };

  const openReport = (r: Report) => {
    setReport(r);
    setLastUrl(r.url);
    setView("performance");
    window.scrollTo(0, 0);
  };

  if (loadingUrl) {
    return <LoadingScreen t={t} url={loadingUrl} onCancel={cancelAnalysis} />;
  }

  if (view === "landing") {
    return (
      <Landing
                {...{ t, lang, theme, setTheme, setLang }}
        error={error ? t.errors[error] : null}
        initialUrl={lastUrl}
        hasReport={!!report}
        onOpenReport={() => report && openReport(report)}
        runAnalysis={runAnalysis}
      />
    );
  }

  return (
    <Dashboard
      {...{ view, setView, t, lang, theme, setTheme, setLang, report, history, device, setDevice }}
      onOpenReport={openReport}
      onClearHistory={() => {
        clearHistory();
        setHistory([]);
      }}
      onReanalyze={runAnalysis}
    />
  );
}
