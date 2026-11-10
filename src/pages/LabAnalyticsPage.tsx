import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { LanguageDropdown } from "../components/LanguageDropdown";
import { getAnalyticsConfig } from "../lib/analytics/config";
import { cta, dropoff, forms, pages } from "../lib/analytics/metrics";
import { clearEvents, readEvents, type AnalyticsEvent } from "../lib/analytics/store";
import { listLeads } from "../lib/b2b/leads";

function formatTime(seconds: number | null | undefined) {
  if (typeof seconds !== "number" || !Number.isFinite(seconds)) return "—";
  const total = Math.round(seconds);
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  if (minutes <= 0) return `${rest}s`;
  return `${minutes}m ${rest < 10 ? "0" : ""}${rest}s`;
}

function formatRatio(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return `${Math.round(value * 100)}%`;
}

function formatDepth(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return `${Math.round(value)}%`;
}

function environmentAllows() {
  if (window.GELATO_ANALYTICS_ENABLED === false) return false;
  const cfg = getAnalyticsConfig();
  return cfg.enabled !== false;
}

function sendingOn() {
  if (!environmentAllows()) return false;
  const cfg = getAnalyticsConfig();
  try {
    return localStorage.getItem(cfg.flagKey) !== "0";
  } catch {
    return true;
  }
}

export function LabAnalyticsPage() {
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [sending, setSending] = useState(true);
  const cfg = useMemo(() => getAnalyticsConfig(), []);

  const refresh = useCallback(() => {
    setEvents(readEvents());
    setSending(sendingOn());
  }, []);

  useEffect(() => {
    document.title = "Lab OS · Analytics";
    document.body.classList.add("page-lab");
    refresh();
    const onStorage = () => refresh();
    window.addEventListener("storage", onStorage);
    return () => {
      document.body.classList.remove("page-lab");
      window.removeEventListener("storage", onStorage);
    };
  }, [refresh]);

  const pageRows = useMemo(() => pages(events), [events]);
  const dropRows = useMemo(() => dropoff(events), [events]);
  const ctaRows = useMemo(() => cta(events), [events]);
  const formRows = useMemo(() => forms(events), [events]);
  const leads = useMemo(() => listLeads().slice().reverse(), [events]);
  const visits = pageRows.reduce((sum, row) => sum + row.visits, 0);
  const reads = pageRows.reduce((sum, row) => sum + row.reads, 0);
  const ctr = ctaRows.length
    ? ctaRows.reduce((sum, row) => sum + row.ctr, 0) / ctaRows.length
    : null;
  const allowed = environmentAllows();

  function toggleSending() {
    if (!allowed) return;
    try {
      localStorage.setItem(cfg.flagKey, sending ? "0" : "1");
    } catch {
      /* ignore */
    }
    refresh();
  }

  function onClear() {
    if (!window.confirm("Cancellare le misurazioni locali di questo browser?")) return;
    clearEvents();
    refresh();
  }

  return (
    <div className="lab-shell" data-analytics-admin>
      <aside className="lab-side">
        <div className="lab-brand">
          Lab OS <span>Analytics</span>
        </div>
        <nav>
          <a href="/lab/analytics" aria-current="page">
            Dashboard
          </a>
          <Link to="/">Sito pubblico</Link>
          <Link to="/b2b">Landing B2B</Link>
        </nav>
        <div className="lab-lang">
          <LanguageDropdown align="start" />
        </div>
        <p>
          Percorso operativo <code>/lab/analytics</code>. I numeri arrivano da questo browser, dopo il
          consenso.
        </p>
      </aside>

      <main className="lab-main">
        <div className="lab-top">
          <div>
            <h1>Analytics</h1>
            <p className="lab-lede">Lettura, abbandono e clic del sito pubblico.</p>
          </div>
          <div className="lab-switch">
            <button type="button" aria-pressed={sending} disabled={!allowed} onClick={toggleSending}>
              {sending ? "Invio acceso" : "Invio spento"}
            </button>
            <div>
              <strong>
                {!allowed
                  ? "Motore spento in configurazione"
                  : sending
                    ? "Eventi in uscita"
                    : "Eventi in pausa"}
              </strong>
              <small>
                {!allowed
                  ? "enabled è false in configurazione analytics."
                  : "Flag letto da tutte le pagine su questo browser."}
              </small>
            </div>
          </div>
        </div>

        <div className="lab-meta">
          <span className="lab-pill">
            {cfg.posthogKey ? "PostHog EU, senza cookie" : "PostHog non configurato · archivio locale"}
          </span>
          <span className="lab-pill">{cfg.anonymous ? "Modalità anonima" : "Persistenza estesa"}</span>
          <span className="lab-pill">
            {cfg.requireConsent ? "Solo dopo il consenso" : "Consenso non richiesto"}
          </span>
          <span className="lab-pill">{events.length} eventi</span>
        </div>

        <section className="lab-kpis" aria-label="Riepilogo">
          {[
            ["Visite uniche", String(visits)],
            ["Letture complete", String(reads)],
            ["CTR medio CTA", formatRatio(ctr)],
            ["Ordini confermati", String(formRows.funnel[3].sessions)],
          ].map(([label, value]) => (
            <article className="lab-kpi" key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </article>
          ))}
        </section>

        <section className="lab-card">
          <h2>Pagine più lette e rendimento testi</h2>
          <p className="lab-sub">
            Il tempo effettivo conta solo con la scheda visibile. La lettura completa richiede almeno il
            75% di scorrimento.
          </p>
          {!pageRows.length ? (
            <p className="lab-empty">Nessuna visita misurata. Apri il sito, accetta le misurazioni e naviga.</p>
          ) : (
            <div className="lab-scroll">
              <table>
                <thead>
                  <tr>
                    <th>URL</th>
                    <th className="num">Visite uniche</th>
                    <th className="num">Tempo medio di lettura</th>
                    <th className="num">Scroll medio</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((row) => (
                    <tr key={row.page_path}>
                      <td>
                        <span className="path">{row.page_path}</span>
                        {row.reads ? (
                          <span className="minor">
                            {row.reads} {row.reads === 1 ? "lettura completa" : "letture complete"}
                          </span>
                        ) : null}
                      </td>
                      <td className="num">{row.visits}</td>
                      <td className="num">
                        {formatTime(row.avg_time_seconds)}
                        {row.expected_seconds ? (
                          <span className="minor">teorico {formatTime(row.expected_seconds)}</span>
                        ) : null}
                      </td>
                      <td className="num">
                        {formatDepth(row.avg_depth)}
                        {typeof row.avg_depth === "number" ? (
                          <div className="bar">
                            <i style={{ width: `${Math.max(0, Math.min(100, row.avg_depth))}%` }} />
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="lab-card">
          <h2>Analisi abbandono copywriting</h2>
          <p className="lab-sub">Uscite in cui la persona non supera il 50% della pagina.</p>
          {!dropRows.length ? (
            <p className="lab-empty">Non ci sono ancora uscite misurate.</p>
          ) : (
            <div className="lab-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Pagina</th>
                    <th>Uscite</th>
                    <th>Prima del 50%</th>
                    <th>Tasso</th>
                    <th>Sezione di uscita</th>
                  </tr>
                </thead>
                <tbody>
                  {dropRows.map((row) => (
                    <tr key={row.page_path} className={row.rate >= 0.5 ? "hot" : undefined}>
                      <td className="path">{row.page_path}</td>
                      <td className="num">{row.exits}</td>
                      <td className="num">{row.early}</td>
                      <td className="num">
                        {formatRatio(row.rate)}
                        {row.rate >= 0.5 ? <span className="minor">Da rivedere</span> : null}
                      </td>
                      <td>{row.section_label || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="lab-split">
          <section className="lab-card">
            <h2>Conversione CTA</h2>
            <p className="lab-sub">Click-through per pulsante e per blocco di testo.</p>
            {!ctaRows.length ? (
              <p className="lab-empty">Nessun click su pulsanti tracciati.</p>
            ) : (
              <div className="lab-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Blocco</th>
                      <th>Testo</th>
                      <th>Click</th>
                      <th>CTR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ctaRows.map((row) => (
                      <tr key={`${row.page_path}-${row.track_id}-${row.section_label}`}>
                        <td>
                          <span className="path">{row.section_label}</span>
                          <span className="minor">{row.page_path}</span>
                        </td>
                        <td>{row.track_copy}</td>
                        <td className="num">{row.clicks}</td>
                        <td className="num">{formatRatio(row.ctr)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="lab-card">
            <h2>Funnel e abbandono form</h2>
            <p className="lab-sub">Sessioni uniche per fase.</p>
            <div className="lab-funnel">
              {formRows.funnel.map((step, index) => {
                const labels: Record<string, string> = {
                  view_catalog: "Vede il listino",
                  expand_product_details: "Apre gli ingredienti",
                  checkout_started: "Inizia l'ordine",
                  order_completed: "Conferma l'ordine",
                };
                const previous = index > 0 ? formRows.funnel[index - 1].sessions : 0;
                return (
                  <div className="lab-step" key={step.name}>
                    <b>{labels[step.name] || step.name}</b>
                    <span>
                      {step.sessions}
                      {index > 0 ? ` · ${previous ? formatRatio(step.sessions / previous) : "—"}` : ""}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="lab-sub">
              Conversione dal checkout:{" "}
              {formRows.funnel[2].sessions ? formatRatio(formRows.order_rate) : "—"}
            </p>
            {!formRows.fields.length ? (
              <p className="lab-empty">Nessun abbandono di modulo registrato.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Modulo</th>
                    <th>Campo</th>
                    <th>Abbandoni</th>
                  </tr>
                </thead>
                <tbody>
                  {formRows.fields.map((row) => (
                    <tr key={`${row.form_id}-${row.field_label}`}>
                      <td>{row.form_id}</td>
                      <td>{row.field_label}</td>
                      <td className="num">{row.exits}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>

        <section className="lab-card">
          <h2>Lead B2B</h2>
          <p className="lab-sub">
            Richieste salvate in questo browser con stato lead_b2b_nuovo. Nome e telefono restano in
            questo elenco.
          </p>
          {!leads.length ? (
            <p className="lab-empty">Nessun lead B2B su questo browser.</p>
          ) : (
            <div className="lab-scroll">
              <table>
                <thead>
                  <tr>
                    {["Quando", "Stato", "Locale", "Città", "Tipo", "Nome", "Telefono", "Sim %"].map(
                      (label) => (
                        <th key={label}>{label}</th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => {
                    const when = lead.created_at ? new Date(lead.created_at) : null;
                    const stamp =
                      when && !Number.isNaN(when.getTime())
                        ? when.toLocaleString("it-IT", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "";
                    const sim =
                      lead.sim_margem === "" || lead.sim_margem === undefined || lead.sim_margem === null
                        ? ""
                        : String(lead.sim_margem);
                    return (
                      <tr key={lead.id}>
                        <td>{stamp}</td>
                        <td>{lead.status}</td>
                        <td>{lead.locale}</td>
                        <td>{lead.citta}</td>
                        <td>{lead.tipo}</td>
                        <td>{lead.nome}</td>
                        <td>{lead.telefone}</td>
                        <td>{sim}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <details>
          <summary>Ultimi eventi registrati</summary>
          <ul>
            {!events.length ? (
              <li>Archivio vuoto.</li>
            ) : (
              events
                .slice(-12)
                .reverse()
                .map((event) => {
                  const when = new Date(event.ts);
                  const stamp = when.toLocaleTimeString("it-IT", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  });
                  return (
                    <li key={`${event.ts}-${event.name}-${event.page_path}`}>
                      {stamp} · {event.name} · {event.page_path || event.path}
                    </li>
                  );
                })
            )}
          </ul>
        </details>

        <div className="lab-actions">
          <button type="button" className="ghost" onClick={onClear}>
            Svuota misurazioni locali
          </button>
        </div>
      </main>
    </div>
  );
}
