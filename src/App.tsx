import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AnalyticsBootstrap } from "./components/AnalyticsBootstrap";
import { B2BPage } from "./pages/B2BPage";
import { B2BThanksPage } from "./pages/B2BThanksPage";
import { FranchisePage } from "./pages/FranchisePage";
import { FranchiseThanksPage } from "./pages/FranchiseThanksPage";
import { HomePage } from "./pages/HomePage";
import { LabAnalyticsPage } from "./pages/LabAnalyticsPage";
import { useEffect } from "react";

function ScrollManager() {
  const location = useLocation();
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.slice(1);
      requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      return;
    }
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname, location.hash]);
  return null;
}

export function App() {
  const location = useLocation();
  return (
    <>
      <div hidden data-app-path={location.pathname} />
      <ScrollManager />
      <AnalyticsBootstrap />
      <Routes>
        <Route index element={<HomePage />} />
        <Route path="b2b" element={<B2BPage />} />
        <Route path="b2b/obrigado" element={<B2BThanksPage />} />
        <Route path="franquias" element={<FranchisePage />} />
        <Route path="franquias/obrigado" element={<FranchiseThanksPage />} />
        <Route path="lab/analytics" element={<LabAnalyticsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
