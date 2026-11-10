# Integrazione Gelateria ↔ GelatoSocial

Documentazione completa: `C:\GelatoSocial_v0.3_core\INTEGRAZIONE_GELATERIA_GELATOSOCIAL.md`

## Config locale Gelateria (React)

Override opzionale a runtime:

```html
<script>
  window.GELATO_API_BASE_URL = "http://127.0.0.1:8000/api/v1";
  window.GELATO_ANALYTICS_REMOTE = true;
</script>
```

Oppure file `.env`:

```
VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1
VITE_ANALYTICS_REMOTE=true
```

Default: `http://127.0.0.1:8000/api/v1`

## Avvio sito

```bash
cd C:\Gelateria
npm install
npm run dev
```

Apri:

- Home: `http://127.0.0.1:5173/`
- B2B: `http://127.0.0.1:5173/b2b`
- Franquias: `http://127.0.0.1:5173/franquias`

Build statica:

```bash
npm run build
npm run preview
```

## Lead franchising

Contratto: `docs/FRANCHISE_LEADS_API.md`

```http
POST /api/v1/public/franchise/leads
```

Su GitHub Pages **non** usare localhost: serve backend HTTPS pubblico + `VITE_API_BASE_URL`. Senza di esso il form mostra errore (nessuna conferma finta).