import { useEffect } from "react";
import Container from "react-bootstrap/Container";
import { Link, Navigate } from "react-router-dom";
import { SiteFooter } from "../components/SiteFooter";
import { SiteNavbar } from "../components/SiteNavbar";
import { useI18n } from "../i18n/I18nContext";

export function FranchiseThanksPage() {
  const { t, lang } = useI18n();
  const leadId = (() => {
    try {
      return sessionStorage.getItem("gelato.franchise.lead.ok") || "";
    } catch {
      return "";
    }
  })();

  useEffect(() => {
    document.body.classList.add("page-franquias", "page-franquias-thanks");
    document.title = t("franq.thanks.meta.title");
    return () => {
      document.body.classList.remove("page-franquias", "page-franquias-thanks");
    };
  }, [t, lang]);

  if (!leadId) {
    return <Navigate to="/franquias" replace />;
  }

  return (
    <>
      <SiteNavbar brand="FranciBello" brandTo="/franquias" />
      <main className="franq-thanks" data-section="Confirmação franquia">
        <Container>
          <div className="franq-thanks-box">
            <h1>{t("franq.thanks.title")}</h1>
            <p>{t("franq.thanks.body")}</p>
            <Link to="/" className="btn btn-berry mt-3">
              {t("franq.thanks.home")}
            </Link>
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
