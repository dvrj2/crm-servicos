import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'

export const ProtectedRoute = ({ allowedRoles }: { allowedRoles?: string[] }) => {
  const { isAuthenticated, user, loading } = useAuth()

  if (loading) {
    return <div className="h-screen w-screen flex items-center justify-center">Carregando...</div>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && user?.tipo_role && !allowedRoles.includes(user.tipo_role)) {
    switch (user.tipo_role) {
      case 'admin':
        return <Navigate to="/" replace />
      case 'empresario':
        return <Navigate to="/indicators" replace />
      case 'tecnico':
        return <Navigate to="/schedule" replace />
      case 'cliente':
        return <Navigate to="/customer-portal" replace />
      default:
        return <Navigate to="/login" replace />
    }
  }

  return <Outlet />
}
