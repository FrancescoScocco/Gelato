/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_ANALYTICS_REMOTE?: string;
  readonly VITE_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  GELATO_API_BASE_URL?: string;
  GELATO_ANALYTICS_REMOTE?: boolean;
  GELATO_ANALYTICS_ENABLED?: boolean;
}
