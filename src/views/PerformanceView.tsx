import { useState } from "react";
import { Icon } from "@/components/Icon";
import { MetricCard, RichText, ScoreRing, Sparkline, StatusBadge, statusLabel } from "@/components/ui";
import type { Copy } from "@/i18n/copy";
import { formatBytes, formatMs, scoreStatus } from "@/lib/metrics";
import { cwvAssessment } from "@/lib/report";
import type { Report, Strategy, StrategyReport } from "@/types";

interface PerformanceViewProps {
  t: Copy;
  data: StrategyReport;
  report: Report;
  history: Report[];
  device: Strategy;
}

export function PerformanceView({ t, data, report, history, device }: PerformanceViewProps) {
  const [showAll, setShowAll] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const score = data.scores.performance;
  const status = scoreStatus(score);
  const cwv = cwvAssessment(data);
  const cwvStatus = cwv.total === 0 ? null : cwv.passed === cwv.total ? "good" : "poor";

  const trend = history
    .filter((r) => r.url === report.url)
    .sort((a, b) => a.analyzedAt.localeCompare(b.analyzedAt));
  const trendPoints = trend.map((r) => r[device].scores.performance);

  const recommendations = showAll ? data.opportunities : data.opportunities.slice(0, 3);
  const dateLabel = (iso: string) =>
    new Date(iso).toLocaleDateString(report.lang === "uk" ? "uk-UA" : "en-US", { day: "numeric", month: "short" });

  return (
    <>
      <section className="score-overview card">
        <div className="score-summary">
          <ScoreRing score={score} />
          <div>
            <span>{t.score}</span>
            <StatusBadge status={status} label={statusLabel(status, t)} />
            <small>{data.hasFieldData ? `${t.fieldData} + ${t.labData}` : t.labData}</small>
          </div>
        </div>
        <div className="score-stats">
          <div>
            <strong>{cwv.total ? `${cwv.passed}/${cwv.total}` : "—"}</strong>
            <span>{t.core}</span>
            <small className={cwvStatus ?? "muted"}>
              {cwvStatus ? (cwvStatus === "good" ? t.passed : t.failed) : t.cwvNoField}
            </small>
          </div>
          <div>
            <strong>{data.speedIndex !== null ? formatMs(data.speedIndex) : "—"}</strong>
            <span>{t.speedIndex}</span>
            <small className="muted">{t.labData}</small>
          </div>
          <div>
            <strong>{data.pageWeight !== null ? formatBytes(data.pageWeight) : "—"}</strong>
            <span>{t.pageWeight}</span>
            <small className="muted">{t.labData}</small>
          </div>
        </div>
      </section>

      <div className="section-bar">
        <div>
          <h2>{t.core}</h2>
          <p>{t.coreSubtitle}</p>
        </div>
        {cwvStatus && (
          <StatusBadge status={cwvStatus} label={`${cwv.passed}/${cwv.total} ${t.passed}`} />
        )}
      </div>
      <div className="report-metrics">
        {data.metrics.map((m) => (
          <MetricCard key={m.key} metric={m} t={t} />
        ))}
      </div>

      <div className="report-grid">
        <section className="card trend-card">
          <div className="card-heading">
            <div>
              <h3>{t.trend}</h3>
              <p>{t.trendSubtitle}</p>
            </div>
            <span className="chip">{device === "desktop" ? t.desktop : t.mobile}</span>
          </div>
          {trendPoints.length < 2 ? (
            <p className="empty-state">{t.trendEmpty}</p>
          ) : (
            <div className="chart-large">
              <div className="y-axis">
                <span>100</span>
                <span>50</span>
                <span>0</span>
              </div>
              <Sparkline points={trendPoints} label={t.trend} />
              <div className="x-axis">
                <span>{dateLabel(trend[0].analyzedAt)}</span>
                <span>{dateLabel(trend[trend.length - 1].analyzedAt)}</span>
              </div>
            </div>
          )}
        </section>

        <section className="card recommendations">
          <div className="card-heading">
            <div>
              <h3>{t.recommendations}</h3>
              <p>{t.recommendationsSubtitle}</p>
            </div>
            {data.opportunities.length > 3 && (
              <button className="link-button" onClick={() => setShowAll(!showAll)}>
                {showAll ? t.showLess : `${t.viewAll} (${data.opportunities.length})`}
                <Icon name="arrow" size={16} />
              </button>
            )}
          </div>
          {recommendations.length === 0 && <p className="empty-state">{t.noIssues}</p>}
          {recommendations.map((r, i) => {
            const isOpen = expanded === r.id;
            return (
              <article key={r.id} className={isOpen ? "expanded" : ""}>
                <button
                  className="row-button"
                  onClick={() => setExpanded(isOpen ? null : r.id)}
                  aria-expanded={isOpen}
                >
                  <span className={`priority ${r.status}`}>{i + 1}</span>
                  <span className="row-text">
                    <strong>
                      <RichText text={r.title} />
                    </strong>
                    {r.savings && (
                      <small>
                        {t.saving}: {r.savings}
                      </small>
                    )}
                  </span>
                  <Icon name="chevron" size={18} />
                </button>
                {isOpen && (
                  <p className="row-detail">
                    <RichText text={r.description} />
                  </p>
                )}
              </article>
            );
          })}
        </section>
      </div>
    </>
  );
}
