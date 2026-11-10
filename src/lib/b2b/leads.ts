export type LeadInput = {
  id?: string;
  nome?: string;
  locale?: string;
  telefone?: string;
  citta?: string;
  tipo?: string;
  lang?: string;
  sim_preco?: number | string | null;
  sim_custo?: number | string | null;
  sim_margem?: number | string | null;
  remote_id?: string;
};

export type Lead = {
  id: string;
  status: string;
  created_at: string;
  nome: string;
  locale: string;
  telefone: string;
  citta: string;
  tipo: string;
  lang: string;
  sim_preco: number | "";
  sim_custo: number | "";
  sim_margem: number | "";
  remote_id: string;
};

const KEY = "gelato.b2b.leads";
const LAST = "gelato.b2b.last";
const LAST_REMOTE = "gelato.b2b.last.remote";

export function apiBase() {
  const env = import.meta.env.VITE_API_BASE_URL;
  const base = window.GELATO_API_BASE_URL || env || "http://127.0.0.1:8000/api/v1";
  return String(base).replace(/\/$/, "");
}

function clip(value: unknown, max: number) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function numberOrEmpty(value: unknown): number | "" {
  if (value === null || value === undefined || value === "") return "";
  const n = Number(value);
  return Number.isFinite(n) ? n : "";
}

function read(): Lead[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function buildLocal(input: LeadInput): Lead {
  return {
    id: clip(input.id || `b2b_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, 80),
    status: "lead_b2b_nuovo",
    created_at: new Date().toISOString(),
    nome: clip(input.nome, 120),
    locale: clip(input.locale, 160),
    telefone: clip(input.telefone, 40),
    citta: clip(input.citta, 80),
    tipo: clip(input.tipo, 40),
    lang: clip(input.lang, 12),
    sim_preco: numberOrEmpty(input.sim_preco),
    sim_custo: numberOrEmpty(input.sim_custo),
    sim_margem: numberOrEmpty(input.sim_margem),
    remote_id: clip(input.remote_id || "", 80),
  };
}

function persistLocal(lead: Lead) {
  if (!lead.nome || !lead.locale || !lead.telefone || !lead.citta) {
    throw new Error("incomplete");
  }
  const list = read().filter((item) => item && item.id !== lead.id);
  list.push(lead);
  localStorage.setItem(KEY, JSON.stringify(list.slice(-200)));
  try {
    sessionStorage.setItem(LAST, lead.id);
  } catch {
    /* optional */
  }
  if (lead.remote_id) {
    try {
      sessionStorage.setItem(
        LAST_REMOTE,
        JSON.stringify({
          id: lead.remote_id,
          external_request_id: lead.id,
          saved_at: Date.now(),
        }),
      );
    } catch {
      /* optional */
    }
  }
  return lead;
}

export function latest(): Lead | null {
  let id = "";
  try {
    id = sessionStorage.getItem(LAST) || "";
  } catch {
    id = "";
  }
  const list = read();
  for (let i = list.length - 1; i >= 0; i -= 1) {
    if (list[i]?.id === id) return list[i];
  }
  return null;
}

export function latestRemote(): { id: string; external_request_id?: string; saved_at?: number } | null {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(LAST_REMOTE) || "null");
    if (parsed && typeof parsed === "object" && parsed.id) return parsed;
  } catch {
    /* ignore */
  }
  return null;
}

export function listLeads(): Lead[] {
  return read();
}

export async function submitRemote(input: LeadInput) {
  const local = buildLocal(input);
  if (!local.nome || !local.locale || !local.telefone || !local.citta) {
    throw new Error("incomplete");
  }
  const payload = {
    external_request_id: local.id,
    nome: local.nome,
    nome_attivita: local.locale,
    whatsapp: local.telefone,
    citta: local.citta,
    tipo_attivita: local.tipo,
    lingua: local.lang,
    prezzo_simulato: local.sim_preco === "" ? null : local.sim_preco,
    costo_simulato: local.sim_custo === "" ? null : local.sim_custo,
    margine_simulato: local.sim_margem === "" ? null : local.sim_margem,
  };
  const response = await fetch(`${apiBase()}/public/b2b/leads`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
    mode: "cors",
    credentials: "omit",
  });
  const body = await response.json().catch(() => ({} as { id?: string; detail?: string }));
  if (!response.ok) {
    throw new Error(String(body?.detail || `HTTP ${response.status}`));
  }
  if (!body?.id) throw new Error("missing_id");
  local.remote_id = body.id;
  persistLocal(local);
  return { local, remote: body };
}
