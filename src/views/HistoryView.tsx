import { Icon } from "@/components/Icon";
import type { Copy } from "@/i18n/copy";
import { scoreStatus } from "@/lib/metrics";
import { hostname } from "@/lib/report";
import type { Lang, Report } from "@/types";

export function HistoryView({
  t,
  lang,
  history,
  onOpen,
  onClear,
}: {
  t: Copy;
  lang: Lang;
  history: Report[];
  onOpen: (r: Report) => void;
  onClear: () => void;
}) {
  const format = new Intl.DateTimeFormat(lang === "uk" ? "uk-UA" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const Score = ({ label, value }: { label: string; value: number }) => (
    <span className="history-score">
      <small>{label}</small>
      <b className={scoreStatus(value)}>{value}</b>
    </span>
  );

  return (
    <main className="report-content">
      <div className="audit-heading">
        <div>
          <span className="audit-icon">
            <Icon name="clock" />
          </span>
          <div>
            <h2>{t.historyTitle}</h2>
            <p>{t.historySubtitle}</p>
          </div>
        </div>
        {history.length > 0 && (
          <button className="secondary-button" onClick={onClear}>
            <Icon name="trash" size={16} />
            {t.clearHistory}
          </button>
        )}
      </div>

      <section className="card history-list">
        {history.length === 0 && <p className="empty-state">{t.historyEmpty}</p>}
        {history.map((r) => (
          <button key={r.id} className="history-item" onClick={() => onOpen(r)}>
            <span className="history-site">
              <strong>{hostname(r.finalUrl)}</strong>
              <small>{format.format(new Date(r.analyzedAt))}</small>
            </span>
            <span className="history-scores">
              <Score label={t.mobile} value={r.mobile.scores.performance} />
              <Score label={t.desktop} value={r.desktop.scores.performance} />
              <Score label="SEO" value={r.mobile.scores.seo} />
              <Score label="A11y" value={r.mobile.scores.accessibility} />
            </span>
            <Icon name="chevron" size={18} />
          </button>
        ))}
      </section>
    </main>
  );
}
