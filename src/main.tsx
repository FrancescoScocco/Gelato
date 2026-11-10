import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./styles/tokens.css";
import "./styles/lang-dropdown.css";
import "./styles/consent.css";
import "./styles/home.css";
import "./styles/b2b.css";
import "./styles/franquias.css";
import "./styles/lab.css";
import { App } from "./App";
import { I18nProvider } from "./i18n/I18nContext";

const baseUrl = import.meta.env.BASE_URL || "/";
const basename = baseUrl === "/" ? undefined : baseUrl.replace(/\/$/, "");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter basename={basename}>
      <I18nProvider>
        <App />
      </I18nProvider>
    </BrowserRouter>
  </StrictMode>,
);
