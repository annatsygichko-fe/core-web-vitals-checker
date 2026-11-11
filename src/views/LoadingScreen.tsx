import { useEffect, useState } from "react";
import { Logo } from "@/components/ui";
import type { Copy } from "@/i18n/copy";
import { hostname } from "@/lib/report";

export function LoadingScreen({ t, url, onCancel }: { t: Copy; url: string; onCancel: () => void }) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  // Advance through the steps roughly every 8 seconds, staying on the last one.
  const step = Math.min(Math.floor(seconds / 8), t.scanningSteps.length - 1);

  return (
    <div className="loading-screen" role="status" aria-live="polite">
      <Logo onClick={() => {}} />
      <div className="loader" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <strong>{t.scanning}</strong>
      <p className="loading-url">{hostname(url)}</p>
      <p>
        {t.scanningSteps[step]}… · {seconds} s
      </p>
      <small>{t.scanningHint}</small>
      <button className="secondary-button" onClick={onCancel}>
        {t.cancel}
      </button>
    </div>
  );
}
