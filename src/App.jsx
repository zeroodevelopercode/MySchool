import { AuthProvider, useAuth } from "./auth/AuthProvider.jsx";
import WelcomePage from "./pages/WelcomePage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";

function AppContent() {
  const { loading, user } = useAuth();

  if (loading) {
    return <main className="session-loading"><div className="session-spinner" /><p>Memulihkan sesi SekolahKu...</p></main>;
  }

  return user ? <DashboardPage /> : <WelcomePage />;
}

export default function App() {
  return <AuthProvider><AppContent /></AuthProvider>;
}
