import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import Index from './pages/Index'
import Login from './pages/Login'
import Signup from './pages/Signup'
import NotFound from './pages/NotFound'
import Schedule from './pages/Schedule'
import OrderDetail from './pages/OrderDetail'
import QuotePage from './pages/Quote'
import Execution from './pages/Execution'
import Report from './pages/Report'
import Reports from './pages/Reports'
import Technicians from './pages/Technicians'
import EmpresariosPage from './pages/Empresarios'
import UsersPage from './pages/Users'
import CustomerNew from './pages/CustomerNew'
import TechnicianDashboard from './pages/TechnicianDashboard'
import Finance from './pages/Finance'
import Indicators from './pages/Indicators'
import LogsPage from './pages/Logs'
import Simulator from './pages/Simulator'
import SimulationLogs from './pages/SimulationLogs'
import Settings from './pages/Settings'
import CustomerPortal from './pages/CustomerPortal'
import Layout from './components/Layout'
import Customers from './pages/Customers'
import CompanyCatalog from './pages/CompanyCatalog'
import CompanyReports from './pages/CompanyReports'
import { useEffect } from 'react'
import { AuthProvider, useAuth } from './hooks/use-auth'
import { ProtectedRoute } from './components/ProtectedRoute'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { toast } from 'sonner'

const RootRedirect = () => {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  switch (user.tipo_role) {
    case 'admin':
      return <Navigate to="/painel-admin" replace />
    case 'empresario':
      return <Navigate to="/" replace />
    case 'tecnico':
      return <Navigate to="/painel-tecnico" replace />
    case 'cliente':
      return <Navigate to="/portal-cliente" replace />
    default:
      return <Navigate to="/login" replace />
  }
}

const GlobalErrorHandler = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    const handleRejection = (event: PromiseRejectionEvent) => {
      if (event.reason?.isAbort) return
      event.preventDefault()
      toast.error('Operação não permitida', {
        description: getErrorMessage(event.reason),
      })
    }
    window.addEventListener('unhandledrejection', handleRejection)
    return () => window.removeEventListener('unhandledrejection', handleRejection)
  }, [])

  return <>{children}</>
}

const App = () => (
  <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
    <AuthProvider>
      <GlobalErrorHandler>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<RootRedirect />} />

                <Route element={<ProtectedRoute allowedRoles={['admin', 'empresario']} />}>
                  <Route path="/painel-admin" element={<Index />} />
                  <Route path="/admin" element={<Navigate to="/painel-admin" replace />} />
                  <Route path="/" element={<Index />} />
                  <Route path="/painel-empresario" element={<Navigate to="/" replace />} />
                  <Route path="/order/:id" element={<OrderDetail />} />
                  <Route path="/order/:id/quote" element={<QuotePage />} />
                  <Route path="/technicians" element={<Technicians />} />
                  <Route path="/finance" element={<Finance />} />
                  <Route path="/clientes/novo" element={<CustomerNew />} />
                  <Route path="/clientes" element={<Customers />} />
                  <Route path="/catalogo" element={<CompanyCatalog />} />
                  <Route path="/relatorios-empresa" element={<CompanyReports />} />
                  <Route path="/report/:id" element={<Report />} />
                </Route>

                <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/indicators" element={<Indicators />} />
                  <Route path="/empresarios" element={<EmpresariosPage />} />
                  <Route path="/users" element={<UsersPage />} />
                  <Route path="/logs" element={<LogsPage />} />
                  <Route path="/simulator" element={<Simulator />} />
                  <Route path="/settings/sandbox" element={<SimulationLogs />} />
                  <Route path="/settings/general" element={<Settings />} />
                </Route>

                <Route
                  element={<ProtectedRoute allowedRoles={['admin', 'empresario', 'tecnico']} />}
                >
                  <Route path="/agenda-tecnico" element={<Schedule />} />
                  <Route path="/schedule" element={<Navigate to="/agenda-tecnico" replace />} />
                  <Route path="/execution/:id" element={<Execution />} />
                </Route>

                <Route element={<ProtectedRoute allowedRoles={['admin', 'tecnico']} />}>
                  <Route path="/painel-tecnico" element={<TechnicianDashboard />} />
                </Route>

                <Route element={<ProtectedRoute allowedRoles={['admin', 'cliente']} />}>
                  <Route path="/portal-cliente" element={<CustomerPortal />} />
                  <Route
                    path="/customer-portal"
                    element={<Navigate to="/portal-cliente" replace />}
                  />
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </GlobalErrorHandler>
    </AuthProvider>
  </BrowserRouter>
)

export default App
