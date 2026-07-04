import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import LandingPage from "./pages/Landingpage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
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
          path="/dashboard/*"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
      </Routes>
      <ChatbotWidget />
    </>
  );
}
