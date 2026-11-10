import { useEffect, useState } from "react";
import { useI18n } from "../i18n/I18nContext";
import { getAnalyticsConfig } from "../lib/analytics/config";

type Consent = "unknown" | "granted" | "denied";

function readConsent(): Consent {
  const cfg = getAnalyticsConfig();
  try {
    const value = localStorage.getItem(cfg.consentKey);
    if (value === "granted" || value === "denied") return value;
  } catch {
    /* ignore */
  }
  return "unknown";
}

export function ConsentBanner() {
  const { t } = useI18n();
  const [consent, setConsent] = useState<Consent>("unknown");

  useEffect(() => {
    setConsent(readConsent());
  }, []);

  function choose(value: "granted" | "denied") {
    const cfg = getAnalyticsConfig();
    try {
      localStorage.setItem(cfg.consentKey, value);
    } catch {
      /* ignore */
    }
    setConsent(value);
  }

  if (consent !== "unknown") {
    return (
      <button
        type="button"
        className="ga-privacy"
        onClick={() => {
          try {
            localStorage.removeItem(getAnalyticsConfig().consentKey);
          } catch {
            /* ignore */
          }
          setConsent("unknown");
        }}
      >
        {consent === "granted" ? t("consent.on", "Privacidade · ativa") : t("consent.off", "Privacidade · off")}
      </button>
    );
  }

  return (
    <div className="ga-banner" role="dialog" aria-label={t("consent.aria", "Medição anônima")}>
      <p>
        <strong>{t("consent.title", "Medição anônima")}</strong>
        {t(
          "consent.body",
          "Medimos leitura, rolagem e cliques para melhorar textos e pedidos. Sem cookies de rastreamento e sem dados pessoais. Você pode recusar.",
        )}
      </p>
      <div className="ga-actions">
        <button type="button" className="ga-accept" onClick={() => choose("granted")}>
          {t("consent.accept", "Aceitar medições")}
        </button>
        <button type="button" className="ga-reject" onClick={() => choose("denied")}>
          {t("consent.reject", "Recusar")}
        </button>
      </div>
    </div>
  );
}
