import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LayoutDashboard } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast({
        title: 'Erro de validação',
        description: 'Email inválido',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    const { error, user } = await signIn(email, password)
    setLoading(false)

    if (error) {
      if (error.message === 'INACTIVE_ACCOUNT') {
        toast({
          title: 'Acesso Negado',
          description: 'Sua conta está inativa. Entre em contato com o administrador.',
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Erro ao entrar',
          description: 'Email ou senha incorretos',
          variant: 'destructive',
        })
      }
    } else if (user) {
      const role = user.tipo_role
      if (role === 'admin') {
        navigate('/painel-admin')
      } else if (role === 'empresario') {
        navigate('/painel-empresa')
      } else if (role === 'tecnico') {
        navigate('/agenda-tecnico')
      } else if (role === 'cliente') {
        navigate('/portal-cliente')
      } else {
        navigate('/painel-admin')
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardHeader className="space-y-2 text-center pb-6">
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <LayoutDashboard className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Gestão Operacional</CardTitle>
          <CardDescription className="text-base">
            Entre para gerenciar ordens de serviço
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nome@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
