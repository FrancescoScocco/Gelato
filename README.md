# Gelateria (React)

Sito pubblico FranciBello / Donna Stroupe Berry Bliss: Home, B2B, thank-you e Lab Analytics.

## Stack

- Vite + React + TypeScript
- React Router
- Bootstrap 5 + `react-bootstrap`
- i18n PT / IT / EN via dropdown (`localStorage` key `gelato.lang`)

## Avvio

```bash
cd C:\Gelateria
npm install
npm run dev
```

Apri `http://127.0.0.1:5173/`.

## Build statica

```bash
npm run build
npm run preview
```

Output in `dist/`, adatto a GitHub Pages o server statico.

## GitHub Pages

Il sito va su `https://francescoscocco.github.io/Gelato/`.

1. In **Settings → Pages → Build and deployment → Source** scegli **GitHub Actions** (non “Deploy from a branch”).
2. Push su `main`: il workflow `.github/workflows/deploy-pages.yml` fa `npm run build` con `base: /Gelato/` e pubblica `dist/`.

Build locale con lo stesso base:

```bash
set VITE_BASE=/Gelato/
npm run build
npm run preview
```

Poi apri `http://127.0.0.1:4173/Gelato/`.

## Route

| Path | Pagina |
|------|--------|
| `/` | Home |
| `/b2b` | Landing B2B + form lead + simulator |
| `/b2b/obrigado` | Thank-you lead |
| `/lab/analytics` | Dashboard analytics locale |

Catalogo B2B PDF: `/downloads/catalogo-b2b.pdf`

## API GelatoSocial

Override runtime (prima del boot) o via env Vite:

```html
<script>
  window.GELATO_API_BASE_URL = "http://127.0.0.1:8000/api/v1";
  window.GELATO_ANALYTICS_REMOTE = true;
</script>
```

Env:

- `VITE_API_BASE_URL`
- `VITE_ANALYTICS_REMOTE=false` per spegnere il remote

Default API: `http://127.0.0.1:8000/api/v1`

Lead B2B → `POST /public/b2b/leads`

## Legacy

Gli HTML/JS statici precedenti sono in `_legacy/` come riferimento. Il flusso ufficiale è Vite.

## Palette

- Pistacchio `#264A3B`
- Vaniglia `#FFF8ED`
- Fragola `#B84945`
