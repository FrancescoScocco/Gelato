import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AnalyticsBootstrap } from "./components/AnalyticsBootstrap";
import { PageTransition } from "./components/PageTransition";
import { B2BPage } from "./pages/B2BPage";
import { B2BThanksPage } from "./pages/B2BThanksPage";
import { FranchisePage } from "./pages/FranchisePage";
import { FranchiseThanksPage } from "./pages/FranchiseThanksPage";
import { HomePage } from "./pages/HomePage";
import { LabAnalyticsPage } from "./pages/LabAnalyticsPage";

export function App() {
  const location = useLocation();
  return (
    <>
      <div hidden data-app-path={location.pathname} />
      <AnalyticsBootstrap />
      <PageTransition>
        {(displayLocation) => (
          <Routes location={displayLocation}>
            <Route index element={<HomePage />} />
            <Route path="b2b" element={<B2BPage />} />
            <Route path="b2b/obrigado" element={<B2BThanksPage />} />
            <Route path="franquias" element={<FranchisePage />} />
            <Route path="franquias/obrigado" element={<FranchiseThanksPage />} />
            <Route path="lab/analytics" element={<LabAnalyticsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </PageTransition>
    </>
  );
}
