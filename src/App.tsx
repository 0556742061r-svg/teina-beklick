import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppDataProvider } from "@/store/useStore";
import Index from "@/pages/Index";
import DevicesPage from "@/pages/DevicesPage";
import FinancesPage from "@/pages/FinancesPage";
import DataFilterPage from "@/pages/DataFilterPage";
import InstallationsTrackerPage from "@/pages/InstallationsTrackerPage";
import InstallationPointsPage from "@/pages/InstallationPointsPage";
import GabbaiPortalPage from "@/pages/GabbaiPortalPage";
import AuthPage from "@/pages/AuthPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import PartnerFeedbackPage from "@/pages/PartnerFeedbackPage";
import UnsubscribePage from "@/pages/UnsubscribePage";

// NOTE: Auth guard is intentionally permissive in this frontend-only prototype
// (mock data, no real Supabase session). Wire up `useAuth` + a real <RequireAuth>
// wrapper here once Supabase is connected, per the spec's security section.
function App() {
  return (
    <AppDataProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/devices" element={<DevicesPage />} />
          <Route path="/finances" element={<FinancesPage />} />
          <Route path="/data-filter" element={<DataFilterPage />} />
          <Route path="/installations" element={<InstallationsTrackerPage />} />
          <Route path="/installation-points" element={<InstallationPointsPage />} />
          <Route path="/gabbai-portal" element={<GabbaiPortalPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/gabbai-login" element={<AuthPage gabbai />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/partner-feedback/:id" element={<PartnerFeedbackPage />} />
          <Route path="/unsubscribe" element={<UnsubscribePage />} />
        </Routes>
      </BrowserRouter>
    </AppDataProvider>
  );
}

export default App;
