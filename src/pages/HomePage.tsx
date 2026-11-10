import { useEffect, useState } from "react";
import Accordion from "react-bootstrap/Accordion";
import Carousel from "react-bootstrap/Carousel";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import { Link } from "react-router-dom";
import { HtmlText } from "../components/HtmlText";
import { SiteFooter } from "../components/SiteFooter";
import { SiteNavbar } from "../components/SiteNavbar";
import { useI18n } from "../i18n/I18nContext";

const FLAVORS = [
  {
    img: "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=800",
    title: "flavor.berries",
    body: "flavor.berries.body",
    fallbackTitle: "Frutas Vermelhas",
    fallbackBody: "Mirtilos, framboesas e amoras em um creme suave e perfumado.",
  },
  {
    img: "https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=800",
    title: "flavor.caramel",
    body: "flavor.caramel.body",
    fallbackTitle: "Caramelo Salgado",
    fallbackBody: "Caramelo cozido em fogo baixo com um toque de sal marinho.",
  },
  {
    img: "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=800",
    title: "flavor.strawberry",
    body: "flavor.strawberry.body",
    fallbackTitle: "Morango Italiano",
    fallbackBody: "Morangos frescos e creme leve: o sabor da Riviera.",
  },
  {
    img: "https://images.unsplash.com/photo-1567206563064-6f60f40a2b57?w=800",
    title: "flavor.chocolate",
    body: "flavor.chocolate.body",
    fallbackTitle: "Chocolate Amargo",
    fallbackBody: "Cacau monorigem, intenso e aveludado, direto do coração da Itália.",
  },
];

const MENU_ITEMS = [
  { name: "CREMA ANTICA", body: "menu.crema.body", ing: "menu.crema.ing", price: "R$ 18" },
  { name: "PISTACCHIO DI BRONTE", body: "menu.pistachio.body", ing: "menu.pistachio.ing", price: "R$ 24" },
  { name: "STRACCIATELLA", body: "menu.stracciatella.body", ing: "menu.stracciatella.ing", price: "R$ 18" },
  { name: "MORANGO ITALIANO", body: "menu.strawberry.body", ing: "menu.strawberry.ing", price: "R$ 18" },
  { name: "NOCCIOLA PIEMONTE IGP", body: "menu.hazelnut.body", ing: "menu.hazelnut.ing", price: "R$ 22" },
  { name: "LIMONE DI AMALFI", body: "menu.lemon.body", ing: "menu.lemon.ing", price: "R$ 18" },
];

const REVIEWS = [
  { key: "home.reviews.one", fallback: '"Pistache de Bronte de verdade, parece estar na Itália!"' },
  { key: "home.reviews.two", fallback: '"O gelato proteico é uma virada de jogo. Tão bom quanto o clássico."' },
  { key: "home.reviews.three", fallback: '"Delivery rapidíssimo, chegou perfeito. Top de Jundiaí!"' },
];

const FAQ = [
  {
    q: "faq.q1",
    a: "faq.a1",
    qFallback: "O gelato é realmente artesanal?",
    aFallback:
      "Sim. Produzimos todos os dias no nosso laboratório em Jundiaí, com leite fresco e ingredientes selecionados da melhor tradição italiana. Sem preparados industriais.",
  },
  {
    q: "faq.q2",
    a: "faq.a2",
    qFallback: "O gelato proteico é indicado para quem treina?",
    aFallback:
      "Foi desenvolvido justamente para atletas e entusiastas do fitness: alto teor de proteína, zero açúcares adicionados, sabor cremoso. Ideal para o pós-treino.",
  },
  {
    q: "faq.q3",
    a: "faq.a3",
    qFallback: "Quanto tempo leva o delivery?",
    aFallback:
      "Em média 25 minutos na zona urbana de Jundiaí. Usamos embalagens térmicas para garantir a textura perfeita da nossa vitrine até a sua colher.",
  },
  {
    q: "faq.q4",
    a: "faq.a4",
    qFallback: "Posso pedir para eventos e festas?",
    aFallback:
      "Claro. Preparamos bolos de gelato, potes personalizados e propostas dedicadas para casamentos, aniversários e empresas. Fale conosco e montamos juntos o seu cardápio.",
  },
];

export function HomePage() {
  const { t, lang } = useI18n();
  const [openIng, setOpenIng] = useState<string | null>(null);

  useEffect(() => {
    document.title = t("home.meta.title", "Donna Stroupe – Berry Bliss");
    document.body.classList.add("page-home");
    return () => document.body.classList.remove("page-home");
  }, [t, lang]);

  return (
    <div data-read-root>
      <SiteNavbar />

      <header className="hero" id="home" data-section="Início">
        <Container>
          <span className="hero-stamp">{t("home.hero.stamp", "Autêntica Gelateria Italiana · Jundiaí, SP")}</span>
          <HtmlText as="h1" html={t("home.hero.title", 'O verdadeiro gelato <span class="pink">italiano</span><br>no coração de Jundiaí.')} />
          <p className="lead-italic">{t("home.hero.lead")}</p>
          <div className="hero-actions">
            <a href="#menu" className="btn-pill" data-track-id="hero_cardapio">
              {t("home.hero.menu", "Conheça o Cardápio")}
            </a>
            <a href="#delivery" className="btn-pill outline" data-track-id="hero_delivery">
              {t("home.hero.delivery", "Peça pelo Delivery")}
            </a>
          </div>
        </Container>
      </header>

      <section className="section-dark text-center" id="sabores">
        <Container>
          <span className="eyebrow">{t("home.flavors.eyebrow")}</span>
          <h2 className="section-title">{t("home.flavors.title")}</h2>
          <p className="small-text mx-auto mt-3" style={{ maxWidth: 680 }}>
            {t("home.flavors.body")}
          </p>
          <a href="#menu" className="btn-pill mt-3">
            {t("home.flavors.cta")}
          </a>
        </Container>
      </section>

      <section className="section-dark pt-0" id="vitrine">
        <Container>
          <Row className="g-0">
            {FLAVORS.map((flavor) => (
              <Col md={6} lg={3} key={flavor.title}>
                <div className="flavor-card">
                  <img src={flavor.img} alt={t(flavor.title, flavor.fallbackTitle)} />
                  <div className="flavor-card-content">
                    <h3>{t(flavor.title, flavor.fallbackTitle)}</h3>
                    <p className="small-text">{t(flavor.body, flavor.fallbackBody)}</p>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      <section className="story" id="about">
        <Container>
          <Row className="align-items-end g-5">
            <Col lg={6} className="text-center">
              <img src="/img/chef.png" className="img-fluid chef-avatar" alt={t("home.story.alt")} />
            </Col>
            <Col lg={6} className="pb-5">
              <span className="story-badge">{t("home.story.badge")}</span>
              <HtmlText as="h2" className="section-title" html={t("home.story.title")} />
              <p className="small-text mt-3">{t("home.story.p1")}</p>
              <p className="small-text">{t("home.story.p2")}</p>
              <a href="#menu" className="btn-pill mt-2">
                {t("home.story.cta")}
              </a>
            </Col>
          </Row>
        </Container>
      </section>

      <section className="cream-section" id="menu">
        <Container>
          <div className="text-center">
            <span className="eyebrow" style={{ color: "#B84945" }}>
              {t("home.menu.eyebrow")}
            </span>
            <h2 className="section-title mb-5">{t("home.menu.title")}</h2>
          </div>
          <Row className="g-4 mb-5">
            {[
              ["home.cat.artisan", "home.cat.artisan.body", "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=500"],
              ["home.cat.sorbet", "home.cat.sorbet.body", "https://images.unsplash.com/photo-1567206563064-6f60f40a2b57?w=500"],
              ["home.cat.shake", "home.cat.shake.body", "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500"],
            ].map(([title, body, img]) => (
              <Col md={4} key={title}>
                <div className="category-card">
                  <img src={img} alt={t(title)} />
                  <h4>{t(title)}</h4>
                  <div className="stars">★★★★★</div>
                  <p>{t(body)}</p>
                </div>
              </Col>
            ))}
          </Row>
          <Row className="g-5">
            {[MENU_ITEMS.slice(0, 3), MENU_ITEMS.slice(3)].map((col, idx) => (
              <Col md={6} key={idx}>
                {col.map((item) => {
                  const open = openIng === item.name;
                  return (
                    <div key={item.name} className="menu-row d-flex justify-content-between align-items-start">
                      <div>
                        <h5>{item.name}</h5>
                        <p>{t(item.body)}</p>
                        <button
                          type="button"
                          className="ingredient-toggle"
                          aria-expanded={open}
                          onClick={() => setOpenIng(open ? null : item.name)}
                        >
                          {t("menu.ingredients", "Ingredientes")}
                        </button>
                        {open ? <p className="ingredient-panel">{t(item.ing)}</p> : null}
                      </div>
                      <strong>{item.price}</strong>
                    </div>
                  );
                })}
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      <section className="proteico" id="proteico">
        <Container>
          <Row className="g-5 align-items-center">
            <Col lg={6}>
              <div className="proteico-hero">
                <span className="proteico-pill">{t("home.protein.pill")}</span>
              </div>
              <div className="macro-grid">
                <div className="macro">
                  <strong>20g</strong>
                  <span>{t("home.protein.protein")}</span>
                </div>
                <div className="macro">
                  <strong>0</strong>
                  <span>{t("home.protein.sugar")}</span>
                </div>
                <div className="macro">
                  <strong>160</strong>
                  <span>{t("home.protein.kcal")}</span>
                </div>
              </div>
            </Col>
            <Col lg={6}>
              <span className="eyebrow">{t("home.protein.eyebrow")}</span>
              <HtmlText as="h2" className="section-title" html={t("home.protein.title")} />
              <p className="small-text mt-3">{t("home.protein.body")}</p>
              <div className="proteico-features">
                {[
                  ["P", "home.protein.whey", "home.protein.wheyBody"],
                  ["0", "home.protein.zero", "home.protein.zeroBody"],
                  ["N", "home.protein.natural", "home.protein.naturalBody"],
                ].map(([icon, title, body]) => (
                  <div className="proteico-feature" key={title}>
                    <div className="icon">{icon}</div>
                    <div>
                      <h5>{t(title)}</h5>
                      <p>{t(body)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <a href="#contact" className="btn-pill mt-4">
                {t("home.protein.cta")}
              </a>
            </Col>
          </Row>
        </Container>
      </section>

      <section className="delivery" id="delivery">
        <Container>
          <div className="text-center">
            <span className="eyebrow" style={{ color: "#B84945" }}>
              {t("home.delivery.eyebrow")}
            </span>
            <HtmlText as="h2" className="section-title" html={t("home.delivery.title")} />
            <p className="mx-auto mt-3" style={{ maxWidth: 720 }}>
              {t("home.delivery.body")}
            </p>
          </div>
          <Row className="g-4 mt-4">
            {[
              ["home.delivery.direct", "home.delivery.directBody", "home.delivery.directCta"],
              ["home.delivery.whatsapp", "home.delivery.whatsappBody", "home.delivery.chat"],
              ["iFood", "home.delivery.ifoodBody", "home.delivery.ifood"],
              ["home.delivery.pickup", "home.delivery.pickupBody", "home.delivery.pickupCta"],
            ].map(([title, body, cta]) => (
              <Col md={6} lg={3} key={title}>
                <div className="delivery-card">
                  <div className="delivery-icon">
                    <span aria-hidden>✦</span>
                  </div>
                  <h4>{title === "iFood" ? "iFood" : t(title)}</h4>
                  <p>{t(body)}</p>
                  <a href="#contact" className="btn-pill">
                    {t(cta)}
                  </a>
                </div>
              </Col>
            ))}
          </Row>
          <div className="delivery-strip">
            <div>
              <h3>{t("home.delivery.free")}</h3>
              <p>{t("home.delivery.freeBody")}</p>
            </div>
            <a href="#contact" className="btn-pill">
              {t("home.delivery.strip")}
            </a>
          </div>
        </Container>
      </section>

      <section className="section-dark text-center" id="depoimentos">
        <Container>
          <h2 className="section-title">{t("home.reviews.title", "Quem prova, volta.")}</h2>
          <p className="small-text mx-auto mt-3" style={{ maxWidth: 640 }}>
            {t("home.reviews.body", "Nossa comunidade cresce todos os dias.")}
          </p>
          <Carousel className="reviews-carousel mt-4" indicators>
            {REVIEWS.map((item) => (
              <Carousel.Item key={item.key}>
                <div className="bubble">
                  <p>{t(item.key, item.fallback)}</p>
                </div>
              </Carousel.Item>
            ))}
          </Carousel>
        </Container>
      </section>

      <section className="faq" id="faq">
        <Container>
          <div className="text-center mb-4">
            <span className="eyebrow" style={{ color: "#B84945" }}>
              {t("home.faq.eyebrow", "Perguntas frequentes")}
            </span>
            <h2 className="section-title">{t("home.faq.title", "Tudo o que você quer saber.")}</h2>
          </div>
          <Accordion className="faq-accordion">
            {FAQ.map((item, index) => (
              <Accordion.Item eventKey={String(index)} key={item.q}>
                <Accordion.Header>
                  <span className="faq-q-icon">?</span>
                  <span>{t(item.q, item.qFallback)}</span>
                </Accordion.Header>
                <Accordion.Body>{t(item.a, item.aFallback)}</Accordion.Body>
              </Accordion.Item>
            ))}
          </Accordion>
        </Container>
      </section>

      <section className="section-cream py-5" id="franquias-teaser" data-section="Franquias teaser">
        <Container className="text-center">
          <p className="eyebrow text-uppercase fw-bold mb-2" style={{ letterSpacing: "0.12em", color: "var(--color-accent)" }}>
            {t("franq.hero.eyebrow")}
          </p>
          <h2 className="section-title mx-auto" style={{ maxWidth: "18ch" }}>
            {t("franq.hero.title")}
          </h2>
          <Link to="/franquias" className="btn-pill mt-3">
            {t("nav.franquias", "Franquias")}
          </Link>
        </Container>
      </section>

      <section className="section-dark" id="contact">
        <Container>
          <Row className="justify-content-center">
            <Col lg={7}>
              <h2 className="section-title">{t("home.contact.title", "Fale com a gelateria.")}</h2>
              <p className="small-text">{t("home.contact.body")}</p>
              <form
                className="contact-card mt-4"
                onSubmit={(event) => {
                  event.preventDefault();
                }}
              >
                <label htmlFor="nome">{t("home.contact.name", "Nome")}</label>
                <input id="nome" name="nome" required />
                <label htmlFor="email">{t("home.contact.email", "E-mail")}</label>
                <input id="email" name="email" type="email" required />
                <label htmlFor="mensagem">{t("home.contact.message", "Mensagem")}</label>
                <textarea id="mensagem" name="mensagem" rows={4} required />
                <button className="btn-pill" type="submit">
                  {t("home.contact.submit", "Enviar mensagem")}
                </button>
              </form>
            </Col>
          </Row>
        </Container>
      </section>

      <SiteFooter />
    </div>
  );
}
