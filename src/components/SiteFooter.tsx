import type { ReactNode } from "react";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import { Link } from "react-router-dom";
import { useI18n } from "../i18n/I18nContext";
import { ConsentBanner } from "./ConsentBanner";

type Props = {
  children?: ReactNode;
};

export function SiteFooter({ children }: Props) {
  const { t } = useI18n();

  return (
    <footer className="footer" data-section="Rodapé">
      <Container>
        <Row className="g-4">
          <Col md={5}>
            <h3>Donna Stroupe Berry Bliss</h3>
            <p className="small-text">{t("home.footer.blurb")}</p>
          </Col>
          <Col md={3}>
            <h5>{t("home.footer.contact", "Contato")}</h5>
            <p className="small-text">E-mail: ola@berrybliss.com.br</p>
            <p className="small-text">WhatsApp: +55 11 99999-9999</p>
            <p className="small-text">Rua das Gelaterias 123 · Jundiaí, SP</p>
          </Col>
          <Col md={4}>
            <h5>{t("home.footer.nav", "Navegue")}</h5>
            <Link to="/#home">{t("nav.home")}</Link>
            <Link to="/#about">{t("nav.story")}</Link>
            <Link to="/#menu">{t("nav.menuPage")}</Link>
            <Link to="/b2b">{t("nav.b2b")}</Link>
            <Link to="/lab/analytics">Lab</Link>
          </Col>
        </Row>
        {children}
        <div className="footer-bottom">
          © {new Date().getFullYear()} Donna Stroupe · Berry Bliss
          <ConsentBanner />
        </div>
      </Container>
    </footer>
  );
}
