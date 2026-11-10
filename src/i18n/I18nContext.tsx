import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { homeMessages, type Lang } from "./homeMessages";
import { b2bMessages } from "./b2bMessages";

const STORAGE_KEY = "gelato.lang";

type Dictionary = Record<string, string>;

const packs: Record<Lang, Dictionary> = {
  "pt-BR": { ...homeMessages["pt-BR"], ...b2bMessages["pt-BR"] },
  it: { ...homeMessages.it, ...b2bMessages.it },
  en: { ...homeMessages.en, ...b2bMessages.en },
};

function normalize(value: string | null | undefined): Lang {
  if (value === "it" || value === "en" || value === "pt-BR") return value;
  if (value === "pt" || value === "pt-br" || value === "pt_BR") return "pt-BR";
  return "pt-BR";
}

type I18nContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string, fallback?: string) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      return normalize(localStorage.getItem(STORAGE_KEY));
    } catch {
      return "pt-BR";
    }
  });

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* optional */
    }
  }, []);

  const t = useCallback(
    (key: string, fallback = "") => {
      return packs[lang]?.[key] || packs["pt-BR"]?.[key] || fallback;
    },
    [lang],
  );

  useEffect(() => {
    document.documentElement.lang = lang;
    const title = packs[lang]?.["home.meta.title"] || packs[lang]?.["b2b.meta.title"];
    if (title && !window.location.pathname.includes("/b2b") && !window.location.pathname.includes("/lab")) {
      /* pages set their own titles */
    }
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

export type { Lang };
