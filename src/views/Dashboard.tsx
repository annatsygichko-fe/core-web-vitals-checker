import { useState } from "react";
import { Icon } from "@/components/Icon";
import { Logo, ThemeLanguage } from "@/components/ui";
import type { Copy } from "@/i18n/copy";
import { hostname } from "@/lib/report";
import type { Lang, Report, Strategy, Theme, View } from "@/types";
import { AuditView } from "@/views/AuditView";
import { HistoryView } from "@/views/HistoryView";
import { PerformanceView } from "@/views/PerformanceView";

interface DashboardProps {
  view: View;
  setView: (v: View) => void;
  t: Copy;
  lang: Lang;
  theme: Theme;
  setTheme: (v: Theme) => void;
  setLang: (v: Lang) => void;
  report: Report | null;
  history: Report[];
  device: Strategy;
  setDevice: (d: Strategy) => void;
  onOpenReport: (r: Report) => void;
  onClearHistory: () => void;
  onReanalyze: (url: string) => void;
}

export function Dashboard(props: DashboardProps) {
  const { view, setView, t, lang, theme, setTheme, setLang, report, history, device } = props;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const data = report?.[device];

  const pageTitle =
    view === "performance" ? t.performance : view === "seo" ? t.seo : view === "accessibility" ? t.accessibility : t.history;

  return (
    <div className="dashboard-shell">
      <Sidebar
        view={view}
        setView={setView}
        t={t}
        hasReport={!!report}
        a11yIssues={data?.accessibilityAudits.filter((a) => a.status === "poor").length ?? 0}
        open={sidebarOpen}
        close={() => setSidebarOpen(false)}
      />
      {sidebarOpen && (
        <button className="sidebar-scrim" onClick={() => setSidebarOpen(false)} aria-label={t.closeMenu} />
      )}
      <div className="dashboard-main">
        <header className="app-header">
          <button className="mobile-menu" onClick={() => setSidebarOpen(true)} aria-label={t.menu}>
            <Icon name="menu" />
          </button>
          <div className="breadcrumb">
            <span>{t.dashboard}</span>
            <Icon name="chevron" size={14} />
            <strong>{pageTitle}</strong>
          </div>
          <ThemeLanguage {...{ theme, lang, setTheme, setLang, t }} />
        </header>

        {view === "history" || !report || !data ? (
          <HistoryView
            t={t}
            lang={lang}
            history={history}
            onOpen={props.onOpenReport}
            onClear={props.onClearHistory}
          />
        ) : (
          <main className="report-content">
            <ReportHeader
              t={t}
              lang={lang}
              report={report}
              device={device}
              setDevice={props.setDevice}
              onReanalyze={() => props.onReanalyze(report.url)}
            />
            {view === "performance" ? (
              <PerformanceView t={t} data={data} report={report} history={history} device={device} />
            ) : (
              <AuditView key={view} type={view === "seo" ? "seo" : "accessibility"} t={t} data={data} />
            )}
          </main>
        )}
      </div>
    </div>
  );
}

function Sidebar({
  view,
  setView,
  t,
  hasReport,
  a11yIssues,
  open,
  close,
}: {
  view: View;
  setView: (v: View) => void;
  t: Copy;
  hasReport: boolean;
  a11yIssues: number;
  open: boolean;
  close: () => void;
}) {
  const items: { target: View; label: string; icon: string; needsReport: boolean }[] = [
    { target: "performance", label: t.performance, icon: "pulse", needsReport: true },
    { target: "seo", label: t.seo, icon: "search", needsReport: true },
    { target: "accessibility", label: t.accessibility, icon: "access", needsReport: true },
    { target: "history", label: t.history, icon: "clock", needsReport: false },
  ];

  return (
    <aside className={`sidebar ${open ? "open" : ""}`}>
      <div className="side-logo">
        <Logo onClick={() => setView("landing")} />
        <button className="sidebar-close" onClick={close} aria-label={t.closeMenu}>
          <Icon name="close" />
        </button>
      </div>
      <button className="button new-analysis" onClick={() => setView("landing")}>
        <Icon name="plus" />
        {t.newAnalysis}
      </button>
      <nav aria-label={t.dashboard}>
        <span>{t.dashboard}</span>
        {items.map((item) => (
          <button
            className={item.target === view ? "active" : ""}
            aria-current={item.target === view ? "page" : undefined}
            key={item.target}
            disabled={item.needsReport && !hasReport}
            onClick={() => {
              setView(item.target);
              close();
            }}
          >
            <Icon name={item.icon} />
            <span>{item.label}</span>
            {item.target === "accessibility" && a11yIssues > 0 && <b>{a11yIssues}</b>}
          </button>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <a
          className="sidebar-note"
          href="https://developers.google.com/speed/docs/insights/v5/about"
          target="_blank"
          rel="noreferrer noopener"
        >
          <Icon name="info" size={16} />
          {t.dataSource}
        </a>
      </div>
    </aside>
  );
}

function ReportHeader({
  t,
  lang,
  report,
  device,
  setDevice,
  onReanalyze,
}: {
  t: Copy;
  lang: Lang;
  report: Report;
  device: Strategy;
  setDevice: (d: Strategy) => void;
  onReanalyze: () => void;
}) {
  const date = new Intl.DateTimeFormat(lang === "uk" ? "uk-UA" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(report.analyzedAt));

  return (
    <>
      <div className="report-title">
        <div>
          <span>{t.report}</span>
          <h1>
            <a href={report.finalUrl} target="_blank" rel="noreferrer noopener">
              {hostname(report.finalUrl)}
              <Icon name="external" size={16} />
            </a>
          </h1>
          <p>
            <Icon name="clock" size={15} />
            {t.analyzed}: {date}
          </p>
        </div>
        <button className="secondary-button" onClick={onReanalyze} aria-label={t.reanalyze}>
          <Icon name="refresh" size={17} />
          {t.reanalyze}
        </button>
      </div>
      <div className="report-tabs" role="tablist">
        {(["desktop", "mobile"] as const).map((d) => (
          <button
            key={d}
            role="tab"
            aria-selected={device === d}
            className={device === d ? "active" : ""}
            onClick={() => setDevice(d)}
          >
            <Icon name={d === "desktop" ? "monitor" : "phone"} />
            {d === "desktop" ? t.desktop : t.mobile}
          </button>
        ))}
      </div>
    </>
  );
}
