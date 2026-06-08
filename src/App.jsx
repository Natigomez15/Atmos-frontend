import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { AuthProvider, useAuth } from "./context/AuthContext"
import { ProveedorToast } from "./components/common/SistemaToast"
import EnvoltorioPagina from "./components/common/EnvoltorioPagina"

import DashboardPage       from "./pages/DashboardPage"
import MonitoringPage      from "./pages/MonitoringPage"
import RoomsPage           from "./pages/RoomsPage"
import CommandsPage        from "./pages/CommandsPage"
import PredictionsPage     from "./pages/PredictionsPage"
import ReportsPage         from "./pages/ReportsPage"
import NodesPage           from "./pages/NodesPage"
import AlertasPage         from "./pages/AlertasPage"
import LoginPage           from "./pages/LoginPage"
import UsersPage           from "./pages/UsersPage"
import AjustesPage         from "./pages/AjustesPage"
import PabellonPage        from "./pages/PabellonPage"
import PaginaNoEncontrada  from "./pages/PaginaNoEncontrada"

const clienteConsultas = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
    },
  },
})

function pag(Componente) {
  return (
    <EnvoltorioPagina>
      <Componente />
    </EnvoltorioPagina>
  )
}

function ContenidoApp() {
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
        <Route path="/login"      element={pag(LoginPage)} />
        <Route path="/dashboard"  element={pag(DashboardPage)} />
        <Route path="/rooms"      element={pag(RoomsPage)} />
        <Route path="/monitoring" element={pag(MonitoringPage)} />
        <Route path="/commands"   element={pag(CommandsPage)} />
        <Route path="/predictions" element={pag(PredictionsPage)} />
        <Route path="/alerts"     element={pag(AlertasPage)} />
        <Route path="/reports"    element={pag(ReportsPage)} />
        <Route path="/nodes"      element={pag(NodesPage)} />
        <Route path="/users"      element={pag(UsersPage)} />
        <Route path="/settings"   element={pag(AjustesPage)} />
        <Route path="/pabellon"   element={pag(PabellonPage)} />
        <Route path="/"           element={<Navigate to="/dashboard" replace />} />
        <Route path="*"           element={<PaginaNoEncontrada />} />
      </Routes>
    </BrowserRouter>
  )
}

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={clienteConsultas}>
        <ProveedorToast>
          <ContenidoApp />
        </ProveedorToast>
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
