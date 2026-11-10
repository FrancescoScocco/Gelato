import { type FormEvent, useEffect, useRef, useState } from "react";
import Accordion from "react-bootstrap/Accordion";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import { Link, useNavigate } from "react-router-dom";
import { SiteFooter } from "../components/SiteFooter";
import { SiteNavbar } from "../components/SiteNavbar";
import { useI18n } from "../i18n/I18nContext";
import { capture } from "../lib/analytics/store";
import {
  BR_UFS,
  isValidBrWhatsapp,
  isValidEmail,
  submitFranchiseLead,
} from "../lib/franchise/leads";

const imgBase = `${import.meta.env.BASE_URL}img/`;

type FormState = {
  nome: string;
  whatsapp: string;
  email: string;
  cidade: string;
  estado: string;
  possui_negocio: string;
  experiencia: string;
  mensagem: string;
};

const EMPTY: FormState = {
  nome: "",
  whatsapp: "",
  email: "",
  cidade: "",
  estado: "",
  possui_negocio: "",
  experiencia: "",
  mensagem: "",
};

export function FranchisePage() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const formStarted = useRef(false);
  const submitting = useRef(false);

  useEffect(() => {
    document.body.classList.add("page-franquias");
    document.title = t("franq.meta.title");
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", t("franq.meta.description"));
    capture("franchise_page_view", { page: "/franquias" });
    return () => document.body.classList.remove("page-franquias");
  }, [t, lang]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const onCta = (label: string, target: string) => {
    capture("franchise_cta_click", { label, target });
    scrollTo(target);
  };

  const onFieldFocus = () => {
    if (!formStarted.current) {
      formStarted.current = true;
      capture("franchise_form_start", { page: "/franquias" });
    }
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (form.nome.trim().length < 2) next.nome = "required";
    if (!isValidBrWhatsapp(form.whatsapp)) next.whatsapp = t("franq.form.error.whatsapp");
    if (!isValidEmail(form.email)) next.email = t("franq.form.error.email");
    if (form.cidade.trim().length < 2) next.cidade = "required";
    if (!form.estado) next.estado = "required";
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting.current || loading) return;
    setError("");
    if (!validate()) {
      setError(t("franq.form.error.validation"));
      capture("franchise_form_error", { reason: "validation" });
      return;
    }
    submitting.current = true;
    setLoading(true);
    capture("franchise_form_submit", { page: "/franquias" });
    try {
      const result = await submitFranchiseLead({
        nome: form.nome.trim(),
        whatsapp: form.whatsapp.trim(),
        email: form.email.trim(),
        cidade: form.cidade.trim(),
        estado: form.estado,
        possui_negocio: form.possui_negocio,
        experiencia: form.experiencia.trim(),
        mensagem: form.mensagem.trim(),
        lingua: lang,
      });
      if (!result.ok) {
        setError(t("franq.form.error"));
        capture("franchise_form_error", { reason: "remote", detail: result.error.slice(0, 80) });
        return;
      }
      capture("franchise_lead_submitted", { page: "/franquias" });
      sessionStorage.setItem("gelato.franchise.lead.ok", result.lead.id);
      navigate("/franquias/obrigado");
    } finally {
      setLoading(false);
      submitting.current = false;
    }
  };

  const set =
    (key: keyof FormState) =>
    (value: string) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    };

  return (
    <>
      <SiteNavbar brand="FranciBello" brandTo="/franquias" />

      <header className="franq-hero" id="franq-hero" data-section="Franquias Hero">
        <div className="franq-hero-bg" aria-hidden="true" />
        <Container className="franq-hero-inner">
          <p className="franq-eyebrow">{t("franq.hero.eyebrow")}</p>
          <h1>{t("franq.hero.title")}</h1>
          <p className="franq-lead">{t("franq.hero.sub")}</p>
          <div className="franq-cta-row">
            <Button className="btn-berry btn-lg" onClick={() => onCta("hero_primary", "franq-form")}>
              {t("franq.hero.cta")}
            </Button>
            <Button
              variant="outline-light"
              className="btn-lg franq-btn-ghost"
              onClick={() => onCta("hero_secondary", "franq-how")}
            >
              {t("franq.hero.cta2")}
            </Button>
          </div>
        </Container>
      </header>

      <section className="franq-section franq-cream" id="franq-why" data-section="Por que FranciBello">
        <Container>
          <p className="franq-eyebrow dark">{t("franq.why.eyebrow")}</p>
          <h2 className="franq-h2">{t("franq.why.title")}</h2>
          <Row className="g-4 mt-2">
            {[1, 2, 3].map((n) => (
              <Col md={4} key={n}>
                <article className="franq-card">
                  <h3>{t(`franq.why.${n}.title`)}</h3>
                  <p>{t(`franq.why.${n}.body`)}</p>
                </article>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      <section className="franq-section franq-green" id="franq-concept" data-section="Conceito">
        <Container>
          <p className="franq-eyebrow">{t("franq.concept.eyebrow")}</p>
          <h2 className="franq-h2 light">{t("franq.concept.title")}</h2>
          <p className="franq-lead light">{t("franq.concept.body")}</p>
          <Row className="g-3 franq-gallery mt-3">
            {[
              {
                src: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&q=80",
                alt: "Gelato artesanal — conceito",
              },
              {
                src: "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=800&q=80",
                alt: "Ambiente gelateria — conceito",
              },
              {
                src: "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=800&q=80",
                alt: "Vitrine gelato — conceito",
              },
            ].map((img) => (
              <Col md={4} key={img.src}>
                <figure className="franq-figure">
                  <img src={img.src} alt={img.alt} loading="lazy" />
                </figure>
              </Col>
            ))}
          </Row>
          <p className="franq-concept-note">{t("franq.concept.note")}</p>
          <Button className="btn-berry mt-3" onClick={() => onCta("concept", "franq-form")}>
            {t("franq.concept.cta")}
          </Button>
        </Container>
      </section>

      <section className="franq-section franq-cream" id="franq-opp" data-section="Oportunidade">
        <Container>
          <p className="franq-eyebrow dark">{t("franq.opp.eyebrow")}</p>
          <h2 className="franq-h2">{t("franq.opp.title")}</h2>
          <p className="franq-lead dark">{t("franq.opp.body")}</p>
          <Row className="g-4 mt-2">
            {[1, 2, 3].map((n) => (
              <Col md={4} key={n}>
                <div className="franq-step">
                  <span className="franq-step-num">0{n}</span>
                  <h3>{t(`franq.opp.${n}.title`)}</h3>
                  <p>{t(`franq.opp.${n}.body`)}</p>
                </div>
              </Col>
            ))}
          </Row>
          <Button className="btn-berry mt-4" onClick={() => onCta("opp", "franq-form")}>
            {t("franq.opp.cta")}
          </Button>
        </Container>
      </section>

      <section className="franq-section franq-green" id="franq-founder" data-section="Fundador">
        <Container>
          <Row className="align-items-center g-4">
            <Col md={5}>
              <figure className="franq-founder-photo">
                <img src={`${imgBase}chef.png`} alt="FranciBello" loading="lazy" />
              </figure>
            </Col>
            <Col md={7}>
              <p className="franq-eyebrow">{t("franq.founder.eyebrow")}</p>
              <h2 className="franq-h2 light">{t("franq.founder.title")}</h2>
              <p className="franq-lead light">{t("franq.founder.body")}</p>
              <blockquote className="franq-quote">{t("franq.founder.quote")}</blockquote>
            </Col>
          </Row>
        </Container>
      </section>

      <section className="franq-section franq-cream" id="franq-how" data-section="Como funciona">
        <Container>
          <p className="franq-eyebrow dark">{t("franq.how.eyebrow")}</p>
          <h2 className="franq-h2">{t("franq.how.title")}</h2>
          <Row className="g-4 mt-2">
            {[1, 2, 3, 4].map((n) => (
              <Col md={6} lg={3} key={n}>
                <div className="franq-step">
                  <span className="franq-step-num">0{n}</span>
                  <h3>{t(`franq.how.${n}.title`)}</h3>
                  <p>{t(`franq.how.${n}.body`)}</p>
                </div>
              </Col>
            ))}
          </Row>
          <Button className="btn-berry mt-4" onClick={() => onCta("how", "franq-form")}>
            {t("franq.how.cta")}
          </Button>
        </Container>
      </section>

      <section className="franq-section franq-cream border-top" id="franq-faq" data-section="FAQ">
        <Container>
          <h2 className="franq-h2 mb-4">{t("franq.faq.title")}</h2>
          <Accordion flush className="franq-faq">
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <Accordion.Item eventKey={String(n)} key={n}>
                <Accordion.Header>{t(`franq.faq.${n}.q`)}</Accordion.Header>
                <Accordion.Body>
                  {t(`franq.faq.${n}.a`)}
                  {n === 6 ? (
                    <>
                      {" "}
                      <Link to="/b2b">{t("franq.faq.6.link")}</Link>
                    </>
                  ) : null}
                </Accordion.Body>
              </Accordion.Item>
            ))}
          </Accordion>
        </Container>
      </section>

      <section
        className="franq-section franq-form-section"
        id="franq-form"
        data-section="Formulário Franquias"
      >
        <Container>
          <div className="franq-form-wrap">
            <h2 className="franq-h2">{t("franq.form.title")}</h2>
            <p className="franq-lead dark">{t("franq.form.sub")}</p>
            {error ? <Alert variant="danger">{error}</Alert> : null}
            <Form onSubmit={onSubmit} noValidate>
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>{t("franq.field.name")} *</Form.Label>
                    <Form.Control
                      value={form.nome}
                      onChange={(e) => set("nome")(e.target.value)}
                      onFocus={onFieldFocus}
                      isInvalid={!!fieldErrors.nome}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>{t("franq.field.whatsapp")} *</Form.Label>
                    <Form.Control
                      value={form.whatsapp}
                      onChange={(e) => set("whatsapp")(e.target.value)}
                      onFocus={onFieldFocus}
                      placeholder="(11) 99999-9999"
                      isInvalid={!!fieldErrors.whatsapp}
                      required
                    />
                    <Form.Control.Feedback type="invalid">{fieldErrors.whatsapp}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>{t("franq.field.email")} *</Form.Label>
                    <Form.Control
                      type="email"
                      value={form.email}
                      onChange={(e) => set("email")(e.target.value)}
                      onFocus={onFieldFocus}
                      isInvalid={!!fieldErrors.email}
                      required
                    />
                    <Form.Control.Feedback type="invalid">{fieldErrors.email}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>{t("franq.field.city")} *</Form.Label>
                    <Form.Control
                      value={form.cidade}
                      onChange={(e) => set("cidade")(e.target.value)}
                      onFocus={onFieldFocus}
                      isInvalid={!!fieldErrors.cidade}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group>
                    <Form.Label>{t("franq.field.state")} *</Form.Label>
                    <Form.Select
                      value={form.estado}
                      onChange={(e) => set("estado")(e.target.value)}
                      onFocus={onFieldFocus}
                      isInvalid={!!fieldErrors.estado}
                      required
                    >
                      <option value="">{t("franq.field.state.blank")}</option>
                      {BR_UFS.map((uf) => (
                        <option key={uf} value={uf}>
                          {uf}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>{t("franq.field.hasBusiness")}</Form.Label>
                    <Form.Select
                      value={form.possui_negocio}
                      onChange={(e) => set("possui_negocio")(e.target.value)}
                      onFocus={onFieldFocus}
                    >
                      <option value="">{t("franq.field.hasBusiness.blank")}</option>
                      <option value="sim">{t("franq.field.hasBusiness.yes")}</option>
                      <option value="nao">{t("franq.field.hasBusiness.no")}</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>{t("franq.field.experience")}</Form.Label>
                    <Form.Control
                      value={form.experiencia}
                      onChange={(e) => set("experiencia")(e.target.value)}
                      onFocus={onFieldFocus}
                    />
                  </Form.Group>
                </Col>
                <Col xs={12}>
                  <Form.Group>
                    <Form.Label>{t("franq.field.message")}</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={form.mensagem}
                      onChange={(e) => set("mensagem")(e.target.value)}
                      onFocus={onFieldFocus}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <p className="franq-privacy mt-3">
                {t("franq.form.privacy")}{" "}
                <a href="#privacy" onClick={(e) => e.preventDefault()}>
                  Privacy
                </a>
              </p>
              <p className="franq-legal small">{t("franq.legal.note")}</p>
              <Button type="submit" className="btn-berry btn-lg mt-2" disabled={loading}>
                {loading ? t("franq.form.loading") : t("franq.form.submit")}
              </Button>
            </Form>
          </div>
        </Container>
      </section>

      <SiteFooter />
    </>
  );
}
