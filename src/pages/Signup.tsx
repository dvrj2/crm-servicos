import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { LayoutDashboard } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { extractFieldErrors, type FieldErrors } from '@/lib/pocketbase/errors'

export default function Signup() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [cpfCnpj, setCpfCnpj] = useState('')
  const [tipoPerfil, setTipoPerfil] = useState<'Prestador' | 'Cliente'>('Prestador')
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  const { signUpUser } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setFieldErrors({})

    let hasClientError = false
    const currentErrors: FieldErrors = {}

    if (!name.trim()) {
      currentErrors.name = 'Nome é obrigatório'
      hasClientError = true
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      currentErrors.email = 'Email inválido'
      hasClientError = true
    }
    if (password.length < 8) {
      currentErrors.password = 'A senha deve ter no mínimo 8 caracteres'
      hasClientError = true
    }
    if (!cpfCnpj.trim()) {
      currentErrors.cpf_cnpj = 'CPF/CNPJ é obrigatório'
      hasClientError = true
    }

    if (hasClientError) {
      setFieldErrors(currentErrors)
      return
    }

    setLoading(true)
    const { error, user } = await signUpUser({
      name,
      email,
      password,
      cpf_cnpj: cpfCnpj,
      tipo_perfil: tipoPerfil,
    })
    setLoading(false)

    if (error) {
      setFieldErrors(extractFieldErrors(error))
      toast({
        title: 'Erro no cadastro',
        description: 'Verifique os dados informados e tente novamente.',
        variant: 'destructive',
      })
    } else if (user) {
      toast({
        title: 'Conta criada com sucesso',
        description: 'Bem-vindo ao sistema!',
      })
      const role = user.tipo_role
      if (role === 'admin') navigate('/admin')
      else if (role === 'empresario') navigate('/painel-empresario')
      else if (role === 'tecnico') navigate('/painel-tecnico')
      else if (role === 'cliente') navigate('/portal-cliente')
      else navigate('/admin')
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
          <CardTitle className="text-2xl font-bold tracking-tight">Criar Conta</CardTitle>
          <CardDescription className="text-base">
            Preencha os dados abaixo para se cadastrar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-3">
              <Label>Tipo de Perfil</Label>
              <RadioGroup
                value={tipoPerfil}
                onValueChange={(v: 'Prestador' | 'Cliente') => setTipoPerfil(v)}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Prestador" id="prestador" />
                  <Label htmlFor="prestador" className="cursor-pointer font-normal">
                    Prestador
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Cliente" id="cliente" />
                  <Label htmlFor="cliente" className="cursor-pointer font-normal">
                    Cliente
                  </Label>
                </div>
              </RadioGroup>
              {fieldErrors.tipo_perfil && (
                <p className="text-sm text-red-500">{fieldErrors.tipo_perfil}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input
                id="name"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              {fieldErrors.name && <p className="text-sm text-red-500">{fieldErrors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpfCnpj">CPF / CNPJ</Label>
              <Input
                id="cpfCnpj"
                placeholder="Apenas números"
                value={cpfCnpj}
                onChange={(e) => setCpfCnpj(e.target.value)}
                required
              />
              {fieldErrors.cpf_cnpj && (
                <p className="text-sm text-red-500">{fieldErrors.cpf_cnpj}</p>
              )}
            </div>

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
              {fieldErrors.email && <p className="text-sm text-red-500">{fieldErrors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Mínimo de 8 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {fieldErrors.password && (
                <p className="text-sm text-red-500">{fieldErrors.password}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Cadastrando...' : 'Cadastrar'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-slate-500">
            Já possui uma conta?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Fazer login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
