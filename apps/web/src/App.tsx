import { WorkRecordsPage, WorkRecordPage } from "./views/pages/WorkRecordsPage";
import { InvoicesPage, InvoicePage } from "./views/pages/InvoicesPage";
import { PaymentsPage } from "./views/pages/PaymentsPage";
import { DashboardPage } from "./views/pages/DashboardPage";
import { ReportsPage } from "./views/pages/ReportsPage";
import { SettingsPage } from "./views/pages/SettingsPage";

import { AddWorkPage } from "./views/pages/AddWorkPage";
import { MachineryPage } from "./views/pages/MachineryPage";
import { PaymentDetailPage } from "./views/pages/PaymentDetailPage";
import { MachineryDetailPage } from "./views/pages/MachineryDetailPage";
import { ActivityHistoryPage } from "./views/pages/ActivityHistoryPage";
import {
  FarmersPage,
  NewFarmerPage,
  FarmerProfilePage,
} from "./views/pages/FarmersPage";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSession } from "./controllers/useSession";
import { navigation, pages } from "./models/navigation";
import { Button, Loading } from "./views/components/ui";
import { AppLayout } from "./views/layouts/AppLayout";
import {
  AuthPanel,
  LoginPage,
  ProfilePage,
  RegisterPage,
} from "./views/pages/AuthPages";
import { PlaceholderPage } from "./views/pages/PlaceholderPage";

function AppRoutes() {
  const { state, retry, setSession } = useSession();
  const { t } = useTranslation();
  if (state.status !== "ready") {
    return (
      <AuthPanel title={t("brand")}>
        {state.status === "loading" ? (
          <Loading />
        ) : (
          <>
            <p role="alert">{t("auth.unavailable")}</p>
            <Button onClick={retry}>{t("auth.retry")}</Button>
          </>
        )}
      </AuthPanel>
    );
  }
  const { session } = state;
  const dashboard = <Navigate to={pages.dashboard.path} replace />;
  return (
    <Routes>
      <Route
        path="/login"
        element={session ? dashboard : <LoginPage onSession={setSession} />}
      />
      <Route
        path="/register"
        element={session ? dashboard : <RegisterPage />}
      />
      <Route
        element={session ? <AppLayout /> : <Navigate to="/login" replace />}
      >
        <Route index element={dashboard} />
        {navigation.map((page) => (
          <Route
            key={page}
            path={pages[page].path}
            element={
              page === "farmers" ? (
                <FarmersPage />
              ) : page === "dashboard" ? (
                <DashboardPage />
              ) : page === "reports" ? (
                <ReportsPage />
              ) : page === "settings" ? (
                <SettingsPage session={session!} onSession={setSession} />
              ) : page === "addWork" ? (
                <AddWorkPage />
              ) : page === "jobs" ? (
                <WorkRecordsPage />
              ) : page === "invoices" ? (
                <InvoicesPage />
              ) : page === "payments" ? (
                <PaymentsPage />
              ) : page === "machinery" ? (
                <MachineryPage />
              ) : (
                <PlaceholderPage page={page} />
              )
            }
          />
        ))}
        <Route path="/jobs/:id" element={<WorkRecordPage />} />
        <Route path="/work-records/:id" element={<WorkRecordPage />} />
        <Route path="/invoices/:id" element={<InvoicePage />} />
        <Route path="/payments/:id" element={<PaymentDetailPage />} />
        <Route path="/machinery/:id" element={<MachineryDetailPage />} />
        <Route path="/activities" element={<ActivityHistoryPage />} />

        <Route path="/farmers/new" element={<NewFarmerPage />} />
        <Route path="/farmers/:id" element={<FarmerProfilePage />} />
        {session && (
          <Route
            path="/profile"
            element={
              <ProfilePage
                session={session}
                onLogout={() => setSession(null)}
              />
            }
          />
        )}
        <Route path="*" element={dashboard} />
      </Route>
    </Routes>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
