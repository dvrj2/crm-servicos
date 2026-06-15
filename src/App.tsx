import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import Index from './pages/Index'
import Login from './pages/Login'
import NotFound from './pages/NotFound'
import Schedule from './pages/Schedule'
import OrderDetail from './pages/OrderDetail'
import QuotePage from './pages/Quote'
import Execution from './pages/Execution'
import Report from './pages/Report'
import Reports from './pages/Reports'
import Technicians from './pages/Technicians'
import EmpresariosPage from './pages/Empresarios'
import Finance from './pages/Finance'
import Indicators from './pages/Indicators'
import LogsPage from './pages/Logs'
import Simulator from './pages/Simulator'
import Layout from './components/Layout'
import { useEffect } from 'react'
import { AuthProvider } from './hooks/use-auth'
import { ProtectedRoute } from './components/ProtectedRoute'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { toast } from 'sonner'

const GlobalErrorHandler = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    const handleRejection = (event: PromiseRejectionEvent) => {
      // Ignora cancelamentos de requisição (abort)
      if (event.reason?.isAbort) return

      // Previne que o erro crashe a aplicação (Generic Crash)
      event.preventDefault()

      // Exibe a mensagem de validação detalhada provida pelo backend
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

            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Index />} />
                <Route path="/order/:id" element={<OrderDetail />} />
                <Route path="/order/:id/quote" element={<QuotePage />} />
                <Route path="/schedule" element={<Schedule />} />
                <Route path="/execution/:id" element={<Execution />} />
                <Route path="/report/:id" element={<Report />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/technicians" element={<Technicians />} />
                <Route path="/empresarios" element={<EmpresariosPage />} />
                <Route path="/finance" element={<Finance />} />
                <Route path="/indicators" element={<Indicators />} />
                <Route path="/logs" element={<LogsPage />} />
                <Route path="/simulator" element={<Simulator />} />
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
