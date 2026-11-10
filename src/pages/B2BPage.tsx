import { type FormEvent, type MouseEvent, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SiteFooter } from "../components/SiteFooter";
import { SiteNavbar } from "../components/SiteNavbar";
import { useI18n } from "../i18n/I18nContext";
import { capture } from "../lib/analytics/store";
import { submitRemote } from "../lib/b2b/leads";
import {
  SIM_SCENARIOS,
  computeScenario,
  money,
  percent,
  readSim,
  writeSim,
} from "../lib/b2b/sim";

const FLAVORS = [
  {
    name: "Crema Antica",
    body: "b2b.flavor.crema",
    img: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=640&q=80",
  },
  {
    name: "Pistacchio di Bronte",
    body: "b2b.flavor.pistachio",
    img: "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=640&q=80",
  },
  {
    name: "Stracciatella",
    body: "b2b.flavor.stracciatella",
    img: "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=640&q=80",
  },
  {
    name: "Nocciola Piemonte IGP",
    body: "b2b.flavor.hazelnut",
    img: "https://images.unsplash.com/photo-1567206563064-6f60f40a2b57?w=640&q=80",
  },
];

const SEGMENTS = [
  ["b2b.seg.restaurant.title", "b2b.seg.restaurant.body"],
  ["b2b.seg.cafe.title", "b2b.seg.cafe.body"],
  ["b2b.seg.gelato.title", "b2b.seg.gelato.body"],
  ["b2b.seg.hotel.title", "b2b.seg.hotel.body"],
];

function requestIdFor() {
  const key = "gelato.b2b.request.lead";
  try {
    const existing = sessionStorage.getItem(key) || "";
    if (existing) return existing;
  } catch {
    /* continue */
  }
  const created = `b2b_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  try {
    sessionStorage.setItem(key, created);
  } catch {
    /* optional */
  }
  return created;
}

export function B2BPage() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const formRef = useRef<HTMLFormElement>(null);
  const [scenarioIndex, setScenarioIndex] = useState(() => {
    const saved = readSim();
    if (saved && Number.isFinite(Number(saved.scenario))) {
      return Math.max(0, Math.min(SIM_SCENARIOS.length - 1, Number(saved.scenario)));
    }
    return 2;
  });
  const [sim, setSim] = useState(() => computeScenario(scenarioIndex));
  const [trackedSim, setTrackedSim] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    document.title = t("b2b.meta.title", "FranciBello B2B");
    document.body.classList.add("page-b2b");
    return () => document.body.classList.remove("page-b2b");
  }, [t, lang]);

  useEffect(() => {
    const next = computeScenario(scenarioIndex);
    setSim(next);
    writeSim(next);
    if (!trackedSim) {
      setTrackedSim(true);
      capture("b2b_simulator_used", { demo: true, scenario: scenarioIndex });
    }
  }, [scenarioIndex, trackedSim]);

  function scrollToForm(event?: MouseEvent) {
    event?.preventDefault();
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    const field = formRef.current?.querySelector("input");
    field?.focus({ preventScroll: true });
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (typeof form.reportValidity === "function" && !form.reportValidity()) return;
    setError(false);
    setSubmitting(true);
    const data = new FormData(form);
    const current = readSim() || sim;
    try {
      capture("b2b_form_started", { track_id: "lead-form" });
      await submitRemote({
        id: requestIdFor(),
        nome: String(data.get("nome") || ""),
        locale: String(data.get("locale") || ""),
        telefone: String(data.get("telefone") || ""),
        citta: String(data.get("citta") || ""),
        tipo: String(data.get("tipo") || ""),
        lang,
        sim_preco: current.price,
        sim_custo: current.cost,
        sim_margem: current.margin,
      });
      capture("b2b_lead_converted", { lead_status: "lead_b2b_nuovo" });
      navigate("/b2b/obrigado");
    } catch {
      setError(true);
      setSubmitting(false);
    }
  }

  return (
    <div className="b2b-app" data-read-root>
      <SiteNavbar brand="FranciBello" variant="b2b" />

      <main>
        <section className="hero" id="b2b-hero" data-section="Abertura B2B">
          <div className="wrap hero-grid">
            <div className="hero-copy">
              <p className="eyebrow light">{t("b2b.hero.eyebrow")}</p>
              <h1>{t("b2b.hero.title")}</h1>
              <p className="sub">{t("b2b.hero.sub")}</p>
              <ul className="micro-benefits">
                <li>{t("b2b.hero.benefit1")}</li>
                <li>{t("b2b.hero.benefit2")}</li>
                <li>{t("b2b.hero.benefit3")}</li>
              </ul>
              <div className="hero-actions">
                <a className="cta" href="#lead-form" data-track-id="b2b_cta_hero" onClick={scrollToForm}>
                  {t("b2b.hero.cta")}
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="band impact cream" id="b2b-margin" data-section="Margem">
          <div className="wrap impact-center">
            <p className="mega-number" aria-hidden="true">
              85%
            </p>
            <h2>{t("b2b.margin.title")}</h2>
            <p className="lead-line">{t("b2b.margin.sub")}</p>
            <p className="claim-note">{t("b2b.margin.note")}</p>
            <a className="cta" href="#lead-form" data-track-id="b2b_cta_margin" onClick={scrollToForm}>
              {t("b2b.margin.cta")}
            </a>
          </div>
        </section>

        <section className="band impact wine" id="b2b-zero" data-section="Zero produção">
          <div className="wrap impact-center">
            <p className="kicker">{t("b2b.zero.kicker")}</p>
            <h2>{t("b2b.zero.title")}</h2>
            <p className="lead-line light">{t("b2b.zero.body")}</p>
          </div>
        </section>

        <section className="band founder-band" id="b2b-italy" data-section="Autenticidade italiana">
          <div className="wrap founder-grid">
            <div className="founder-photo">
              <img src="/img/chef.png" alt="FranciBello" width={720} height={900} loading="lazy" />
            </div>
            <div className="founder-copy">
              <h2>{t("b2b.founder.title")}</h2>
              <p className="lead-line light">{t("b2b.founder.body")}</p>
            </div>
          </div>
        </section>

        <section className="band cream" id="b2b-flavors" data-section="Nossos gelatos">
          <div className="wrap">
            <h2 className="section-title">{t("b2b.flavors.title")}</h2>
            <p className="lead-line light">{t("b2b.flavors.body")}</p>
            <p className="flavor-swipe" aria-hidden="true">
              {t("b2b.flavors.swipe")}
            </p>
            <div
              className="flavor-scroller"
              tabIndex={0}
              role="region"
              aria-label={t("b2b.flavors.swipe.aria")}
            >
              <div className="flavor-grid">
                {FLAVORS.map((flavor) => (
                  <article className="flavor-card" key={flavor.name}>
                    <img src={flavor.img} alt={flavor.name} width={640} height={480} loading="lazy" />
                    <div className="flavor-card-body">
                      <h3>{flavor.name}</h3>
                      <p>{t(flavor.body)}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
            <a className="cta" href="#lead-form" data-track-id="b2b_cta_flavors" onClick={scrollToForm}>
              {t("b2b.flavors.cta")}
            </a>
          </div>
        </section>

        <section className="band cream" id="b2b-segments" data-section="Tipos de negócio">
          <div className="wrap">
            <h2 className="section-title">{t("b2b.segments.title")}</h2>
            <div className="grid-2 segment-grid">
              {SEGMENTS.map(([title, body]) => (
                <article className="segment" key={title}>
                  <h3>{t(title)}</h3>
                  <p>{t(body)}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="band cream" id="b2b-summary" data-section="Resumo dos benefícios">
          <div className="wrap">
            <p className="summary-eyebrow">{t("b2b.summary.kicker")}</p>
            <h2 className="section-title">{t("b2b.summary.title")}</h2>
            <p className="lead-line light">{t("b2b.summary.sub")}</p>
            <div className="summary-table-wrap">
              <table className="summary-table">
                <caption className="visually-hidden">{t("b2b.summary.title")}</caption>
                <thead>
                  <tr>
                    <th scope="col">{t("b2b.summary.col.point")}</th>
                    <th scope="col">{t("b2b.summary.col.value")}</th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <tr key={n}>
                      <th scope="row">{t(`b2b.summary.${n}.label`)}</th>
                      <td>{t(`b2b.summary.${n}.value`)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="claim-note summary-note">{t("b2b.summary.note")}</p>
          </div>
        </section>

        <section className="band cream" id="b2b-sim" data-section="Simulador de margem">
          <div className="wrap sim-grid">
            <div className="sim-intro">
              <h2>{t("b2b.sim.title")}</h2>
              <p className="lead-line light">{t("b2b.sim.body")}</p>
            </div>
            <div className="sim-card" data-b2b-simulator>
              <label htmlFor="sim-slider" className="sim-slider-label">
                {t("b2b.sim.slider")}
              </label>
              <div className="sim-slider-wrap">
                <input
                  id="sim-slider"
                  className="sim-slider"
                  type="range"
                  min={0}
                  max={SIM_SCENARIOS.length - 1}
                  step={1}
                  value={scenarioIndex}
                  aria-valuemin={0}
                  aria-valuemax={SIM_SCENARIOS.length - 1}
                  aria-valuenow={scenarioIndex}
                  onChange={(event) => setScenarioIndex(Number(event.target.value))}
                />
              </div>
              <div className="sim-fake-row" aria-hidden="true">
                <div>
                  <span>{t("b2b.sim.price")}</span>
                  <strong>{money(sim.price)}</strong>
                </div>
                <div>
                  <span>{t("b2b.sim.cost")}</span>
                  <strong>{money(sim.cost)}</strong>
                </div>
              </div>
              <div className="sim-result" aria-live="polite">
                <div className="sim-metrics" data-sim-metrics>
                  <div className="sim-metric-main">
                    <span>{t("b2b.sim.margin")}</span>
                    <strong>{percent(sim.margin)}</strong>
                  </div>
                  <div>
                    <span>{t("b2b.sim.rest")}</span>
                    <strong>{money(sim.rest)}</strong>
                  </div>
                </div>
              </div>
              <p className="promise-note">{t("b2b.sim.note")}</p>
              <a className="cta" href="#lead-form" data-track-id="b2b_cta_sim" onClick={scrollToForm}>
                {t("b2b.sim.cta")}
              </a>
            </div>
          </div>
        </section>

        <section className="band cream" id="b2b-taste" data-section="Degustação">
          <div className="wrap">
            <div className="impact-center">
              <h2>{t("b2b.how.title")}</h2>
              <p className="lead-line">{t("b2b.how.sub")}</p>
            </div>
            <div className="grid-3 steps">
              {[
                ["01", "b2b.how.1.title"],
                ["02", "b2b.how.2.title"],
                ["03", "b2b.how.3.title"],
              ].map(([index, title]) => (
                <article className="card step-card" key={title}>
                  <span className="index">{index}</span>
                  <h3>{t(title)}</h3>
                </article>
              ))}
            </div>
            <div className="impact-center">
              <a className="cta cta-xl" href="#lead-form" data-track-id="b2b_cta_how" onClick={scrollToForm}>
                {t("b2b.how.cta")}
              </a>
            </div>
          </div>
        </section>

        <section className="band close-band" id="b2b-close" data-section="CTA final">
          <div className="wrap close-grid">
            <div className="close-copy">
              <h2>{t("b2b.close.title")}</h2>
              <p className="lead-line light">{t("b2b.close.body")}</p>
            </div>
            <form className="lead-form" id="lead-form" ref={formRef} onSubmit={onSubmit}>
              <h2 className="form-title">{t("b2b.form.title")}</h2>
              <label htmlFor="nome-lead">{t("b2b.field.name")}</label>
              <input id="nome-lead" name="nome" autoComplete="name" required />
              <label htmlFor="locale-lead">{t("b2b.field.venue")}</label>
              <input id="locale-lead" name="locale" autoComplete="organization" required />
              <label htmlFor="tel-lead">{t("b2b.field.phone")}</label>
              <input id="tel-lead" name="telefone" type="tel" inputMode="tel" autoComplete="tel" required />
              <label htmlFor="city-lead">{t("b2b.field.city")}</label>
              <input id="city-lead" name="citta" autoComplete="address-level2" required />
              <label htmlFor="tipo-lead">{t("b2b.field.type")}</label>
              <select id="tipo-lead" name="tipo">
                <option value="">{t("b2b.type.blank")}</option>
                <option value="restaurante">{t("b2b.type.restaurant")}</option>
                <option value="cafeteria">{t("b2b.type.cafe")}</option>
                <option value="confeitaria">{t("b2b.type.bakery")}</option>
                <option value="gelateria">{t("b2b.type.gelato")}</option>
                <option value="hotel">{t("b2b.type.hotel")}</option>
                <option value="outro">{t("b2b.type.other")}</option>
              </select>
              <button className="submit" type="submit" data-track-id="b2b-form-submit" disabled={submitting}>
                {submitting ? t("b2b.form.loading") : t("b2b.form.submit")}
              </button>
              <p className="note">
                <a href="#b2b-privacy">{t("b2b.form.privacy")}</a>
              </p>
              {error ? <p className="error">{t("b2b.form.error")}</p> : null}
            </form>
          </div>
        </section>
      </main>

      <SiteFooter>
        <section id="b2b-privacy" className="privacy-box mt-4" data-section="Privacidade">
          <h2>{t("b2b.privacy.title")}</h2>
          <p>{t("b2b.privacy.body")}</p>
        </section>
      </SiteFooter>
    </div>
  );
}
