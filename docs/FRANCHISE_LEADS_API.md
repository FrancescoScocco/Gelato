# Franchise leads — contratto API (Gelateria ↔ GelatoSocial)

Pipeline **separata** dai lead B2B (`/public/b2b/leads`).

## Endpoint

```http
POST /api/v1/public/franchise/leads
Content-Type: application/json
```

Implementato in GelatoSocial (`public_website.ingest_franchise_lead`).

### Body

| Campo | Obbligatorio | Note |
|-------|--------------|------|
| `external_request_id` | sì | Idempotenza (8–80 char) |
| `nome` | sì | Nome completo |
| `whatsapp` | sì | BR |
| `email` | sì | |
| `cidade` | sì | Città di interesse |
| `estado` | sì | UF (2 char) |
| `possui_negocio` | no | `sim` / `nao` / vuoto |
| `experiencia` | no | |
| `mensagem` | no | |
| `lingua` | no | `pt-BR` / `it` / `en` |
| `origem` | no | default `franquias` |

### Risposta (201 created / 200 idempotent)

```json
{
  "id": "…",
  "external_request_id": "…",
  "nome": "…",
  "whatsapp": "…",
  "email": "…",
  "cidade": "…",
  "estado": "SP",
  "status": "nuovo_interesse",
  "origem": "franquias",
  "created": true,
  "created_at": "…"
}
```

## Stati CRM suggeriti (futuro: CRM → Potenziali Franchising)

- `nuovo_interesse`
- `da_contattare`
- `primo_contatto`
- `profilo_in_valutazione`
- `presentazione_effettuata`
- `trattativa`
- `approvato`
- `non_idoneo`

La UI CRM dedicata **non è ancora** nel gestionale; la tabella `franchise_leads` è pronta lato DB/API pubblica.

## Config Gelateria

| Ambiente | `VITE_API_BASE_URL` / `window.GELATO_API_BASE_URL` |
|----------|-----------------------------------------------------|
| Dev locale | `http://127.0.0.1:8000/api/v1` |
| Produzione (GitHub Pages) | URL **HTTPS pubblico** del backend GelatoSocial |

Il frontend **non** considera riuscito un invio se:

- l’API non risponde / CORS / 4xx–5xx
- in produzione è ancora configurato `localhost` / `127.0.0.1`

In quei casi mostra errore e **non** apre `/franquias/obrigado`.

Disabilitare remote: `VITE_LEADS_REMOTE=false` o `window.GELATO_LEADS_REMOTE = false`.

## Lavoro ancora necessario per il lancio pubblico

1. Esporre GelatoSocial su HTTPS (con CORS verso `francescoscocco.github.io`).
2. Build Gelateria con `VITE_API_BASE_URL` puntato a quell’HTTPS (o inject runtime).
3. UI CRM “Potenziali Franchising” + aggiornamento stati.
4. Documentazione legale franchising BR (COF / Lei 13.966/2019) prima di qualsiasi offerta contrattuale.
