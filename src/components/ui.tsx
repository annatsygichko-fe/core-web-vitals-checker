import type { CSSProperties, ReactNode } from "react";
import { Icon } from "@/components/Icon";
import type { Copy } from "@/i18n/copy";
import { formatMetric, scoreStatus, THRESHOLDS, trackPosition } from "@/lib/metrics";
import type { Lang, Metric, Status, Theme } from "@/types";

export function Logo({ onClick, label = "CoreVitals" }: { onClick: () => void; label?: string }) {
  return (
    <button className="logo" onClick={onClick} aria-label={label}>
      <span className="logo-mark">
        <Icon name="logo" size={23} />
      </span>
      <span>
        Core<span>Vitals</span>
      </span>
    </button>
  );
}

export function ThemeLanguage({
  theme,
  lang,
  setTheme,
  setLang,
  t,
}: {
  theme: Theme;
  lang: Lang;
  setTheme: (v: Theme) => void;
  setLang: (v: Lang) => void;
  t: Copy;
}) {
  return (
    <div className="header-actions">
      <button
        className="icon-btn"
        onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        aria-label={t.changeTheme}
      >
        <Icon name={theme === "light" ? "moon" : "sun"} />
      </button>
      <div className="language" role="group" aria-label={t.language}>
        <button className={lang === "uk" ? "active" : ""} onClick={() => setLang("uk")} aria-pressed={lang === "uk"}>
          UK
        </button>
        <span>/</span>
        <button className={lang === "en" ? "active" : ""} onClick={() => setLang("en")} aria-pressed={lang === "en"}>
          EN
        </button>
      </div>
    </div>
  );
}

export function statusLabel(status: Status, t: Copy): string {
  return status === "good" ? t.good : status === "warning" ? t.warning : t.poor;
}

export function StatusBadge({ status, label }: { status: Status; label: string }) {
  return (
    <span className={`status ${status}`}>
      <span aria-hidden="true">{status === "good" ? "✓" : status === "warning" ? "!" : "×"}</span>
      {label}
    </span>
  );
}

export function ScoreRing({ score, size = "large" }: { score: number; size?: "large" | "small" }) {
  return (
    <div
      className={`score-ring ${size} ${scoreStatus(score)}`}
      style={{ "--score": `${score * 3.6}deg` } as CSSProperties}
      role="img"
      aria-label={`${score} / 100`}
    >
      <div>
        <strong>{score}</strong>
        {size === "large" && <span>/100</span>}
      </div>
    </div>
  );
}

export function MetricCard({
  metric,
  t,
  compact = false,
}: {
  metric: Metric;
  t: Copy;
  compact?: boolean;
}) {
  const [good, poor] = THRESHOLDS[metric.key];
  const sourceLabel =
    metric.source === "field" ? t.fieldData : metric.source === "lab" ? t.labData : t.noData;

  return (
    <article className={`metric-card ${compact ? "compact" : ""}`}>
      <div className="metric-top">
        <span className="metric-key">{metric.key}</span>
        {metric.status && <StatusBadge status={metric.status} label={statusLabel(metric.status, t)} />}
      </div>
      <strong className="metric-value">{formatMetric(metric.key, metric.value)}</strong>
      <span className="metric-note">
        {metric.name}
        {!compact && ` · ${sourceLabel}`}
      </span>
      {!compact && metric.value !== null && metric.status && (
        <>
          <div
            className="metric-track"
            style={
              {
                "--g": `${trackPosition(metric.key, good)}%`,
                "--w": `${trackPosition(metric.key, poor)}%`,
              } as CSSProperties
            }
          >
            <i className={metric.status} style={{ width: `${trackPosition(metric.key, metric.value)}%` }} />
            <b style={{ left: `${trackPosition(metric.key, metric.value)}%` }} />
          </div>
          <div className="metric-scale">
            <span style={{ left: 0 }}>0</span>
            <span style={{ left: `${trackPosition(metric.key, good)}%` }}>{formatMetric(metric.key, good)}</span>
            <span style={{ left: `${trackPosition(metric.key, poor)}%` }}>{formatMetric(metric.key, poor)}</span>
          </div>
        </>
      )}
    </article>
  );
}

/** Area chart for scores in the 0–100 range. */
export function Sparkline({ points, label }: { points: number[]; label: string }) {
  const width = 360;
  const height = 90;
  const coords = points.map((value, i) => {
    const x = points.length === 1 ? width : (i / (points.length - 1)) * width;
    const y = height - (Math.max(0, Math.min(100, value)) / 100) * (height - 8) - 4;
    return [x, y] as const;
  });
  const line = coords.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const last = coords[coords.length - 1];

  return (
    <svg className="sparkline" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label={label}>
      <defs>
        <linearGradient id="fade-primary" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="currentColor" stopOpacity=".25" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path className="area" d={`${line} V${height} H0Z`} />
      <path className="line" d={line} />
      {last && <circle cx={last[0]} cy={last[1]} r="4" />}
    </svg>
  );
}

/**
 * Renders Lighthouse descriptions: supports [links](https://…) and `code`.
 * Builds React nodes instead of using innerHTML, so the text stays safe.
 */
export function RichText({ text }: { text: string }) {
  const nodes: ReactNode[] = [];
  const pattern = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)|`([^`]+)`/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));
    if (match[1]) {
      nodes.push(
        <a key={match.index} href={match[2]} target="_blank" rel="noreferrer noopener">
          {match[1]}
        </a>,
      );
    } else {
      nodes.push(<code key={match.index}>{match[3]}</code>);
    }
    lastIndex = pattern.lastIndex;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));

  return <>{nodes}</>;
}
