import { useEffect } from 'react'
import { Navigate, Outlet, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'

const AccessDenied = ({ role, inactive }: { role?: string; inactive?: boolean }) => {
  const getHomeRoute = () => {
    if (inactive) return '/login'
    switch (role) {
      case 'empresario':
        return '/painel-empresa'
      case 'tecnico':
        return '/painel-tecnico'
      case 'cliente':
        return '/portal-cliente'
      case 'admin':
        return '/painel-admin'
      default:
        return '/login'
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] p-4 text-center">
      <h1 className="text-4xl font-bold text-slate-900 mb-4">Acesso Negado</h1>
      <p className="text-slate-500 mb-8 max-w-md">
        {inactive
          ? 'Sua conta está inativa. Entre em contato com o suporte.'
          : 'Você não tem permissão para acessar esta página. Por favor, retorne ao seu painel principal ou entre em contato com o suporte se achar que isso é um erro.'}
      </p>
      <Button asChild>
        <Link to={getHomeRoute()}>{inactive ? 'Ir para o Login' : 'Voltar para o Início'}</Link>
      </Button>
    </div>
  )
}

export const ProtectedRoute = ({ allowedRoles }: { allowedRoles?: string[] }) => {
  const { isAuthenticated, user, loading, signOut } = useAuth()

  useEffect(() => {
    if (user && user.ativo === false) {
      signOut()
    }
  }, [user, signOut])

  if (loading) {
    return <div className="h-screen w-screen flex items-center justify-center">Carregando...</div>
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  if (user.ativo === false) {
    return <AccessDenied inactive={true} />
  }

  if (allowedRoles && user.tipo_role !== 'admin' && !allowedRoles.includes(user.tipo_role)) {
    return <AccessDenied role={user.tipo_role} />
  }

  return <Outlet />
}
