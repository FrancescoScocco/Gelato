import { useState } from "react";
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import Offcanvas from "react-bootstrap/Offcanvas";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useI18n } from "../i18n/I18nContext";
import { LanguageDropdown } from "./LanguageDropdown";

type NavItem = {
  to: string;
  labelKey: string;
  fallback: string;
  hash?: boolean;
};

const HOME_LINKS: NavItem[] = [
  { to: "/#home", labelKey: "nav.home", fallback: "Início", hash: true },
  { to: "/#about", labelKey: "nav.story", fallback: "Tradição", hash: true },
  { to: "/#menu", labelKey: "nav.menuPage", fallback: "Cardápio", hash: true },
  { to: "/#proteico", labelKey: "nav.protein", fallback: "Gelato Proteico", hash: true },
  { to: "/#delivery", labelKey: "nav.delivery", fallback: "Delivery", hash: true },
  { to: "/#faq", labelKey: "nav.faq", fallback: "FAQ", hash: true },
  { to: "/b2b", labelKey: "nav.b2b", fallback: "B2B" },
  { to: "/franquias", labelKey: "nav.franquias", fallback: "Franquias" },
];

type Props = {
  brand?: string;
  brandTo?: string;
  variant?: "home" | "b2b" | "lab";
};

export function SiteNavbar({
  brand = "Donna Stroupe · Berry Bliss",
  brandTo = "/",
  variant = "home",
}: Props) {
  const { t } = useI18n();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const links =
    variant === "lab"
      ? [
          { to: "/", labelKey: "nav.home", fallback: "Início" },
          { to: "/b2b", labelKey: "nav.b2b", fallback: "B2B" },
          { to: "/franquias", labelKey: "nav.franquias", fallback: "Franquias" },
          { to: "/lab/analytics", labelKey: "nav.lab", fallback: "Lab" },
        ]
      : HOME_LINKS;

  function close() {
    setOpen(false);
  }

  return (
    <>
      <Navbar expand="lg" fixed="top" className="site-navbar" data-analytics-chrome>
        <Container>
          <Navbar.Brand as={Link} to={brandTo}>
            {brand}
          </Navbar.Brand>
          <button
            type="button"
            className="navbar-toggler d-lg-none"
            aria-label={t("nav.menu", "Abrir menu")}
            onClick={() => setOpen(true)}
          >
            <span className="navbar-toggler-icon" />
          </button>
          <Navbar.Collapse className="d-none d-lg-flex justify-content-end">
            <Nav className="align-items-center">
              {links.map((item) =>
                item.hash ? (
                  <Nav.Link key={item.to} href={item.to} className="nav-link">
                    {t(item.labelKey, item.fallback)}
                  </Nav.Link>
                ) : (
                  <Nav.Link
                    key={item.to}
                    as={NavLink}
                    to={item.to}
                    className="nav-link"
                    end={item.to === "/"}
                  >
                    {t(item.labelKey, item.fallback)}
                  </Nav.Link>
                ),
              )}
              <LanguageDropdown className="ms-2" />
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Offcanvas
        show={open}
        onHide={close}
        placement="end"
        className="site-offcanvas text-bg-dark"
        aria-labelledby="site-menu-label"
      >
        <Offcanvas.Header closeButton closeVariant="white">
          <Offcanvas.Title id="site-menu-label">{brand.split("·")[0].trim()}</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <Nav className="flex-column">
            {links.map((item) =>
              item.hash ? (
                <Nav.Link key={item.to} href={item.to} onClick={close}>
                  {t(item.labelKey, item.fallback)}
                </Nav.Link>
              ) : (
                <Nav.Link
                  key={item.to}
                  as={NavLink}
                  to={item.to}
                  onClick={close}
                  className={location.pathname === item.to ? "active" : undefined}
                >
                  {t(item.labelKey, item.fallback)}
                </Nav.Link>
              ),
            )}
          </Nav>
          <LanguageDropdown className="mt-3" align="start" />
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
}
