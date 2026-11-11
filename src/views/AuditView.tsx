import { useState } from "react";
import { Icon } from "@/components/Icon";
import { RichText, ScoreRing, StatusBadge, statusLabel } from "@/components/ui";
import type { Copy } from "@/i18n/copy";
import { scoreStatus } from "@/lib/metrics";
import type { Status, StrategyReport } from "@/types";

type Filter = "all" | Exclude<Status, "good">;

export function AuditView({
  type,
  t,
  data,
}: {
  type: "seo" | "accessibility";
  t: Copy;
  data: StrategyReport;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const isSeo = type === "seo";
  const checks = isSeo ? data.seoAudits : data.accessibilityAudits;
  const title = isSeo ? t.seoTitle : t.accessTitle;
  const score = isSeo ? data.scores.seo : data.scores.accessibility;
  const status = scoreStatus(score);

  const count = (s: Status) => checks.filter((c) => c.status === s).length;
  const visible = filter === "all" ? checks : checks.filter((c) => c.status === filter);

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: t.all },
    { id: "poor", label: t.failedChecks },
    { id: "warning", label: t.warnings },
  ];

  return (
    <>
      <div className="audit-heading">
        <div>
          <span className={`audit-icon ${type}`}>
            <Icon name={isSeo ? "search" : "access"} />
          </span>
          <div>
            <h2>{title}</h2>
            <p>{isSeo ? t.seoSubtitle : t.accessSubtitle}</p>
          </div>
        </div>
        <button className="secondary-button" onClick={() => window.print()}>
          <Icon name="download" size={16} />
          {t.exportPdf}
        </button>
      </div>

      <section className="audit-summary card">
        <div className="audit-score">
          <ScoreRing score={score} />
          <div>
            <span>{title}</span>
            <StatusBadge status={status} label={statusLabel(status, t)} />
            <small>
              {checks.length} {t.checks}
            </small>
          </div>
        </div>
        <div className="audit-counts">
          <div>
            <span className="count-icon good">
              <Icon name="check" />
            </span>
            <strong>{count("good")}</strong>
            <small>{t.passedChecks}</small>
          </div>
          <div>
            <span className="count-icon poor">×</span>
            <strong>{count("poor")}</strong>
            <small>{t.failedChecks}</small>
          </div>
          <div>
            <span className="count-icon warning">!</span>
            <strong>{count("warning")}</strong>
            <small>{t.warnings}</small>
          </div>
        </div>
      </section>

      {!isSeo && (
        <div className="disclaimer">
          <Icon name="info" />
          <div>
            <strong>{t.important}</strong>
            <p>{t.disclaimer}</p>
          </div>
        </div>
      )}

      <section className="audit-results card">
        <div className="card-heading">
          <div>
            <h3>{t.details}</h3>
            <p>{t.detailsSubtitle}</p>
          </div>
          <div className="filter-pills" role="group">
            {filters.map((f) => (
              <button
                key={f.id}
                className={filter === f.id ? "active" : ""}
                aria-pressed={filter === f.id}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="audit-table">
          {visible.length === 0 && <p className="empty-state">{t.emptyFilter}</p>}
          {visible.map((check) => {
            const isOpen = expanded === check.id;
            return (
              <article key={check.id} className={isOpen ? "expanded" : ""}>
                <span className={`check-state ${check.status}`} aria-hidden="true">
                  {check.status === "good" ? <Icon name="check" size={16} /> : check.status === "warning" ? "!" : "×"}
                </span>
                <div>
                  <strong>
                    <RichText text={check.title} />
                  </strong>
                  {check.display && <p>{check.display}</p>}
                </div>
                <StatusBadge status={check.status} label={statusLabel(check.status, t)} />
                <button
                  aria-label={`${t.action}: ${check.title}`}
                  aria-expanded={isOpen}
                  onClick={() => setExpanded(isOpen ? null : check.id)}
                >
                  <Icon name="chevron" size={18} />
                </button>
                {isOpen && (
                  <p className="row-detail">
                    <RichText text={check.description} />
                  </p>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </>
  );
}
