import { useEffect, useMemo } from "react";
import { Link, Navigate } from "react-router-dom";
import { SiteFooter } from "../components/SiteFooter";
import { SiteNavbar } from "../components/SiteNavbar";
import { useI18n } from "../i18n/I18nContext";
import { latest, latestRemote } from "../lib/b2b/leads";

const WHATSAPP = "";

function whatsappConfigured() {
  return /^\d{10,15}$/.test(String(WHATSAPP || ""));
}

function fill(template: string, lead: { nome?: string; locale?: string; citta?: string; telefone?: string }) {
  return String(template)
    .replace(/\{nome\}/g, lead.nome || "")
    .replace(/\{locale\}/g, lead.locale || "")
    .replace(/\{citta\}/g, lead.citta || "")
    .replace(/\{telefone\}/g, lead.telefone || "");
}

export function B2BThanksPage() {
  const { t, lang } = useI18n();
  const lead = useMemo(() => latest(), []);
  const remote = useMemo(() => latestRemote(), []);
  const allowed = !!(remote?.id && lead?.remote_id);

  useEffect(() => {
    document.title = t("b2b.thanks.meta.title", "Pedido recebido · FranciBello");
  }, [t, lang]);

  const waHref = useMemo(() => {
    if (!whatsappConfigured()) return "";
    const text = lead
      ? fill(
          t(
            "b2b.wa.lead",
            "Olá, sou {nome} do {locale} em {citta}. Quero agendar a degustação gratuita FranciBello. WhatsApp: {telefone}",
          ),
          lead,
        )
      : t("b2b.wa.plain", "Olá, quero agendar a degustação gratuita FranciBello.");
    return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;
  }, [lead, t, lang]);

  if (!allowed) {
    return <Navigate to="/b2b" replace />;
  }

  return (
    <div className="thanks-page" data-read-root>
      <SiteNavbar brand="FranciBello" variant="b2b" />
      <main className="thanks">
        <section className="wrap" data-section="Confirmação do lead">
          <div className="thanks-box">
            <h1>{t("b2b.thanks.title")}</h1>
            <p>{t("b2b.thanks.body")}</p>
            <p>{t("b2b.thanks.body2")}</p>
            <div className="actions">
              <a
                className="cta"
                href="/downloads/catalogo-b2b.pdf"
                download="catalogo-b2b.pdf"
                data-track-id="b2b_pdf"
              >
                {t("b2b.thanks.pdf")}
              </a>
              {waHref ? (
                <a
                  className="ghost"
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-track-id="b2b_whatsapp"
                >
                  {t("b2b.thanks.wa")}
                </a>
              ) : null}
              <Link className="ghost" to="/" data-track-id="b2b_thanks_home">
                {t("b2b.thanks.home")}
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
