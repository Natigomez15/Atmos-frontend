import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { AuthProvider, useAuth } from "./context/AuthContext"
import PageWrapper      from "./components/layout/PageWrapper"
import DashboardPage    from "./pages/DashboardPage"
import MonitoringPage   from "./pages/MonitoringPage"
import RoomsPage        from "./pages/RoomsPage"
import CommandsPage     from "./pages/CommandsPage"
import PredictionsPage  from "./pages/PredictionsPage"
import ReportsPage      from "./pages/ReportsPage"
import NodesPage        from "./pages/NodesPage"
import AlertsPage       from "./pages/AlertsPage"
import LoginPage        from "./pages/LoginPage"
import UsersPage        from "./pages/UsersPage"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
    },
  },
})

const PlaceholderPage = ({ title }) => (
  <PageWrapper>
    <div className="flex items-center justify-center h-64">
      <p className="text-muted text-sm">{title} — próximamente</p>
    </div>
  </PageWrapper>
)

function AppContent() {
  const { cargando } = useAuth()

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-secondary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted">Cargando ATMOS...</p>
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"       element={<LoginPage />} />
        <Route path="/dashboard"   element={<DashboardPage />} />
        <Route path="/rooms"       element={<RoomsPage />} />
        <Route path="/monitoring"  element={<MonitoringPage />} />
        <Route path="/commands"    element={<CommandsPage />} />
        <Route path="/predictions" element={<PredictionsPage />} />
        <Route path="/alerts"      element={<AlertsPage />} />
        <Route path="/reports"     element={<ReportsPage />} />
        <Route path="/nodes"       element={<NodesPage />} />
        <Route path="/users"       element={<UsersPage />} />
        <Route path="/settings"    element={<PlaceholderPage title="Ajustes" />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
