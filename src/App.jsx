import { AuthProvider, useAuth } from "./auth/AuthProvider.jsx";
import WelcomePage from "./pages/WelcomePage.jsx";
import OnboardingPage from "./pages/OnboardingPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";

function AppContent() {
  const { loading, user, profile, profileLoading } = useAuth();

  if (loading || (user && profileLoading)) {
    return <main className="session-loading"><div className="session-spinner" /><p>Memulihkan sesi SekolahKu...</p></main>;
  }
  if (!user) return <WelcomePage />;
  if (!profile?.full_name || !profile?.birth_date) return <OnboardingPage />;
  return <DashboardPage />;
}

export default function App() {
  return <AuthProvider><AppContent /></AuthProvider>;
}
