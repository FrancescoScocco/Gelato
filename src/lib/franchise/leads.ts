export type FranchiseLeadPayload = {
  nome: string;
  whatsapp: string;
  email: string;
  cidade: string;
  estado: string;
  possui_negocio?: string;
  experiencia?: string;
  mensagem?: string;
  lingua?: string;
};

export type FranchiseLeadRecord = FranchiseLeadPayload & {
  id: string;
  origem: "franquias";
  created_at: string;
  remote_synced: boolean;
  remote_id?: string | null;
};

type RemoteConfig = {
  apiBaseUrl: string;
  remoteEnabled: boolean;
};

const STORAGE_KEY = "gelato.franchise.leads.v1";

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `fr-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function getFranchiseRemoteConfig(): RemoteConfig {
  const apiBase =
    window.GELATO_API_BASE_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    "http://127.0.0.1:8000/api/v1";
  const remoteFlag =
    window.GELATO_LEADS_REMOTE !== false &&
    import.meta.env.VITE_LEADS_REMOTE !== "false";
  return {
    apiBaseUrl: String(apiBase).replace(/\/$/, ""),
    remoteEnabled: remoteFlag,
  };
}

/** True when the configured API looks like a non-public localhost (unsafe for GitHub Pages). */
export function isLocalhostApiBase(apiBaseUrl: string): boolean {
  try {
    const u = new URL(apiBaseUrl);
    return u.hostname === "127.0.0.1" || u.hostname === "localhost";
  } catch {
    return /127\.0\.0\.1|localhost/i.test(apiBaseUrl);
  }
}

export function isProductionHost(): boolean {
  const host = window.location.hostname;
  return host !== "localhost" && host !== "127.0.0.1";
}

export function listFranchiseLeads(): FranchiseLeadRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as FranchiseLeadRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persist(leads: FranchiseLeadRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(leads.slice(0, 200)));
}

export function digitsOnly(value: string): string {
  return String(value || "").replace(/\D/g, "");
}

/** Brazilian mobile/landline WhatsApp: 10–11 digits, or 12–13 with country 55. */
export function isValidBrWhatsapp(value: string): boolean {
  const d = digitsOnly(value);
  if (d.length >= 10 && d.length <= 11) return true;
  if (d.startsWith("55") && (d.length === 12 || d.length === 13)) return true;
  return false;
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

export async function submitFranchiseLeadRemote(
  payload: FranchiseLeadPayload & { external_request_id: string },
): Promise<{ ok: true; data: Record<string, unknown> } | { ok: false; error: string }> {
  const cfg = getFranchiseRemoteConfig();
  if (!cfg.remoteEnabled) {
    return { ok: false, error: "Remote leads disabled" };
  }
  // Never pretend production can reach the owner's localhost
  if (isProductionHost() && isLocalhostApiBase(cfg.apiBaseUrl)) {
    return {
      ok: false,
      error:
        "Endpoint público HTTPS não configurado. Defina VITE_API_BASE_URL (ou window.GELATO_API_BASE_URL) apontando para GelatoSocial.",
    };
  }

  try {
    const res = await fetch(`${cfg.apiBaseUrl}/public/franchise/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        external_request_id: payload.external_request_id,
        nome: payload.nome,
        whatsapp: payload.whatsapp,
        email: payload.email,
        cidade: payload.cidade,
        estado: payload.estado,
        possui_negocio: payload.possui_negocio || "",
        experiencia: payload.experiencia || "",
        mensagem: payload.mensagem || "",
        lingua: payload.lingua || "",
        origem: "franquias",
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: text || `HTTP ${res.status}` };
    }
    const data = (await res.json()) as Record<string, unknown>;
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "network_error" };
  }
}

/**
 * Saves only after a successful remote persist.
 * Local mirror is for Lab/debug — never used as fake “success” without remote OK.
 */
export async function submitFranchiseLead(
  payload: FranchiseLeadPayload,
): Promise<{ ok: true; lead: FranchiseLeadRecord } | { ok: false; error: string }> {
  const externalId = uuid();
  const remote = await submitFranchiseLeadRemote({
    ...payload,
    external_request_id: externalId,
  });

  if (!remote.ok) {
    return { ok: false, error: remote.error };
  }

  const lead: FranchiseLeadRecord = {
    ...payload,
    id: String(remote.data.id || externalId),
    origem: "franquias",
    created_at: new Date().toISOString(),
    remote_synced: true,
    remote_id: (remote.data.id as string) || externalId,
  };
  const all = listFranchiseLeads();
  all.unshift(lead);
  persist(all);
  return { ok: true, lead };
}

export const BR_UFS = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
] as const;
