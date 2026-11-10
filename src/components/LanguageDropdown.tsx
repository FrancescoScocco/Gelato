import Dropdown from "react-bootstrap/Dropdown";
import { useI18n, type Lang } from "../i18n/I18nContext";

const OPTIONS: { code: Lang; short: string; label: string }[] = [
  { code: "pt-BR", short: "PT", label: "Português" },
  { code: "it", short: "IT", label: "Italiano" },
  { code: "en", short: "EN", label: "English" },
];

type Props = {
  className?: string;
  align?: "start" | "end";
};

export function LanguageDropdown({ className = "", align = "end" }: Props) {
  const { lang, setLang, t } = useI18n();
  const current = OPTIONS.find((o) => o.code === lang) || OPTIONS[0];

  return (
    <Dropdown className={`lang-dropdown ${className}`.trim()} align={align}>
      <Dropdown.Toggle
        variant="link"
        id="lang-dropdown"
        aria-label={t("lang.label", "Idioma")}
      >
        {current.short}
      </Dropdown.Toggle>
      <Dropdown.Menu>
        {OPTIONS.map((opt) => (
          <Dropdown.Item
            key={opt.code}
            active={opt.code === lang}
            onClick={() => setLang(opt.code)}
            aria-label={opt.label}
          >
            {opt.short}
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
}
