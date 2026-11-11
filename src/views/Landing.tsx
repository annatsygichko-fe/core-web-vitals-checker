import { FormEvent, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { Logo, MetricCard, ScoreRing, Sparkline, StatusBadge, ThemeLanguage } from "@/components/ui";
import type { Copy } from "@/i18n/copy";
import { METRIC_NAMES } from "@/lib/metrics";
import { normalizeUrl } from "@/lib/report";
import type { Lang, Metric, Theme } from "@/types";

/** Static sample data for the marketing section (not a real report). */
const DEMO_METRICS: Metric[] = [
  { key: "LCP", name: METRIC_NAMES.LCP, value: 2100, status: "good", source: "field" },
  { key: "INP", name: METRIC_NAMES.INP, value: 184, status: "good", source: "field" },
  { key: "CLS", name: METRIC_NAMES.CLS, value: 0.08, status: "good", source: "field" },
];
const DEMO_TREND = [58, 61, 59, 68, 66, 77, 74, 86, 92];

interface LandingProps {
  t: Copy;
  lang: Lang;
  theme: Theme;
  setTheme: (v: Theme) => void;
  setLang: (v: Lang) => void;
  initialUrl: string;
  error: string | null;
  hasReport: boolean;
  onOpenReport: () => void;
  runAnalysis: (url: string) => void;
}

export function Landing({
  t,
  lang,
  theme,
  setTheme,
  setLang,
  initialUrl,
  error,
  hasReport,
  onOpenReport,
  runAnalysis,
}: LandingProps) {
  const [url, setUrl] = useState(initialUrl.replace(/^https?:\/\//, "").replace(/\/$/, ""));
  const [invalid, setInvalid] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const normalized = normalizeUrl(url);
    if (!normalized) {
      setInvalid(true);
      inputRef.current?.focus();
      return;
    }
    setInvalid(false);
    runAnalysis(normalized);
  };

  const focusForm = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    inputRef.current?.focus({ preventScroll: true });
  };

  const message = invalid ? t.invalidUrl : error;

  return (
    <div className="landing">
      <header className="public-header">
        <Logo onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} />
        <nav>
          {t.nav.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>
        <div className="public-actions">
          <ThemeLanguage {...{ theme, lang, setTheme, setLang, t }} />
          <button className="button small" onClick={hasReport ? onOpenReport : focusForm}>
            {hasReport ? t.openReport : t.start}
          </button>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="ambient one" />
          <div className="ambient two" />
          <div className="hero-copy">
            <span className="eyebrow">
              <span className="eyebrow-dot" />
              {t.eyebrow}
            </span>
            <h1>
              {t.titleA}
              <br />
              <span>{t.titleB}</span>
              <br />
              {t.titleC}
            </h1>
            <p>{t.hero}</p>
            <form className={`url-form ${message ? "has-error" : ""}`} onSubmit={submit} noValidate>
              <label htmlFor="hero-url">{t.urlLabel}</label>
              <div>
                <span className="protocol">https://</span>
                <input
                  id="hero-url"
                  ref={inputRef}
                  type="url"
                  inputMode="url"
                  autoComplete="url"
                  value={url}
                  aria-invalid={!!message}
                  aria-describedby={message ? "hero-url-error" : undefined}
                  onChange={(e) => {
                    setUrl(e.target.value.replace(/^https?:\/\//, ""));
                    setInvalid(false);
                  }}
                  placeholder={t.urlPlaceholder}
                />
                <button className="button" type="submit">
                  {t.analyze}
                  <Icon name="arrow" />
                </button>
              </div>
              {message && (
                <small id="hero-url-error" role="alert">
                  {message}
                </small>
              )}
            </form>
            <div className="hero-links">
              <button onClick={() => document.querySelector("#features")?.scrollIntoView({ behavior: "smooth" })}>
                {t.explore}
                <Icon name="arrow" size={17} />
              </button>
              <span>
                <Icon name="check" size={15} />
                {t.trusted}
              </span>
            </div>
          </div>
          <DashboardPreview t={t} />
        </section>

        <section className="features section" id="features">
          <div className="section-heading">
            <span>{t.featureEyebrow}</span>
            <h2>{t.featureTitle}</h2>
            <p>{t.featureText}</p>
          </div>
          <div className="feature-grid">
            {t.features.map((feature, i) => (
              <article className="feature-card" key={feature.title}>
                <div className={`feature-icon f${i}`}>
                  <Icon name={feature.icon} />
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="vitals-section section" id="metrics">
          <div className="vitals-copy">
            <span className="kicker">CORE WEB VITALS</span>
            <h2>{t.vitalTitle}</h2>
            <p>{t.vitalText}</p>
            <div className="legend">
              <StatusBadge status="good" label={t.good} />
              <StatusBadge status="warning" label={t.warning} />
              <StatusBadge status="poor" label={t.poor} />
            </div>
          </div>
          <div className="vitals-stack">
            {DEMO_METRICS.map((metric) => (
              <MetricCard metric={metric} t={t} key={metric.key} />
            ))}
          </div>
        </section>

        <section className="process section" id="process">
          <div className="section-heading">
            <span>{t.processKicker}</span>
            <h2>{t.stepsTitle}</h2>
          </div>
          <div className="steps">
            {t.steps.map((step, i) => (
              <article key={step.title}>
                <span>0{i + 1}</span>
                <div className="step-icon">
                  <Icon name={["search", "pulse", "check"][i]} />
                </div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="faq section" id="faq">
          <div>
            <span className="kicker">FAQ</span>
            <h2>{t.faqTitle}</h2>
          </div>
          <div className="faq-list">
            {t.faq.map((item, i) => (
              <article className={openFaq === i ? "open" : ""} key={item.q}>
                <h3>
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
                    aria-expanded={openFaq === i}
                    aria-controls={`faq-${i}`}
                  >
                    <span>{item.q}</span>
                    <span aria-hidden="true">{openFaq === i ? "−" : "+"}</span>
                  </button>
                </h3>
                {openFaq === i && <p id={`faq-${i}`}>{item.a}</p>}
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer>
        <div className="footer-brand">
          <Logo onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} />
          <p>{t.footer}</p>
        </div>
        <div className="footer-column">
          <strong>{t.product}</strong>
          {t.nav.map((item) => (
            <a href={item.href} key={item.href}>
              {item.label}
            </a>
          ))}
        </div>
        <div className="footer-column">
          <strong>{t.resources}</strong>
          <a href="https://web.dev/articles/vitals" target="_blank" rel="noreferrer noopener">
            {t.documentation}
          </a>
          <a
            href="https://developers.google.com/speed/docs/insights/v5/get-started"
            target="_blank"
            rel="noreferrer noopener"
          >
            {t.apiDocs}
          </a>
          <a href="https://developer.chrome.com/docs/lighthouse/overview" target="_blank" rel="noreferrer noopener">
            Lighthouse
          </a>
        </div>
        <div className="footer-bottom">
          © {new Date().getFullYear()} CoreVitals · {t.rights}
        </div>
      </footer>
    </div>
  );
}

function DashboardPreview({ t }: { t: Copy }) {
  return (
    <div className="preview-wrap" aria-hidden="true">
      <div className="preview-label">
        <span>{t.preview}</span>
        <StatusBadge status="good" label={t.live} />
      </div>
      <div className="browser">
        <div className="browser-top">
          <span />
          <span />
          <span />
          <div>corevitals.app/report</div>
        </div>
        <div className="preview-app">
          <aside>
            <div className="mini-logo" />
            {[1, 2, 3, 4, 5].map((i) => (
              <i key={i} className={i === 1 ? "active" : ""} />
            ))}
          </aside>
          <div className="preview-main">
            <div className="preview-header">
              <div>
                <strong>{t.overview}</strong>
                <span>{t.based}</span>
              </div>
              <span className="mini-select">{t.desktop} ⌄</span>
            </div>
            <div className="preview-score">
              <ScoreRing score={92} size="small" />
              <div>
                <span>{t.score}</span>
                <strong>
                  92 <StatusBadge status="good" label={t.good} />
                </strong>
              </div>
              <Sparkline points={DEMO_TREND} label={t.trend} />
            </div>
            <div className="preview-title">
              <strong>{t.core}</strong>
              <span>
                <Icon name="check" size={12} />
                {t.allPassed}
              </span>
            </div>
            <div className="preview-metrics">
              {DEMO_METRICS.map((m) => (
                <MetricCard metric={m} t={t} compact key={m.key} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
