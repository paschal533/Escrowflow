import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import LandingPage from "./pages/Landingpage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DashboardShell from "./pages/dashboard/DashboardPage";
import DashboardOverview from "./pages/dashboard/DashboardOverview";
import ProjectsPage from "./pages/projects/ProjectsPage";
import PaymentsPage from "./pages/payments/PaymentsPage";
import UserDisputesPage from "./pages/disputes/UserDisputesPage";
import NotificationsPage from "./pages/notifications/NotificationsPage";
import SettingsPage from "./pages/settings/SettingsPage";
import CreateJobPage from "./pages/jobs/CreateJobPage";
import JobDetailPage from "./pages/jobs/JobDetailPage";
import JobsListPage from "./pages/jobs/JobsListPage";
import AdminPage from "./pages/admin/AdminPage";
import AdminDisputesPage from "./pages/admin/AdminDisputesPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuthStore } from "./store/authStore";
import ChatbotWidget from "./components/ChatbotWidget";

export default function App() {
  useEffect(() => {
    useAuthStore.getState().loadUser();
  }, []);

  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardOverview />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="disputes" element={<UserDisputesPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="settings/*" element={<SettingsPage />} />
          <Route path="jobs/new" element={<CreateJobPage />} />
          <Route path="jobs/:id" element={<JobDetailPage />} />
          <Route path="jobs" element={<JobsListPage />} />
          <Route path="admin" element={<AdminPage />} />
          <Route path="admin/disputes" element={<AdminDisputesPage />} />
          <Route path="profile/bank" element={<SettingsPage />} />
        </Route>
      </Routes>
      <ChatbotWidget />
    </>
  );
}
