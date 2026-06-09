import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import Index from './pages/Index'
import Login from './pages/Login'
import NotFound from './pages/NotFound'
import Schedule from './pages/Schedule'
import Execution from './pages/Execution'
import Report from './pages/Report'
import Reports from './pages/Reports'
import Technicians from './pages/Technicians'
import Finance from './pages/Finance'
import Indicators from './pages/Indicators'
import Layout from './components/Layout'
import { AuthProvider } from './hooks/use-auth'
import { ProtectedRoute } from './components/ProtectedRoute'

const App = () => (
  <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Index />} />
              <Route path="/schedule" element={<Schedule />} />
              <Route path="/execution/:id" element={<Execution />} />
              <Route path="/report/:id" element={<Report />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/technicians" element={<Technicians />} />
              <Route path="/finance" element={<Finance />} />
              <Route path="/indicators" element={<Indicators />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App
