import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createCustomerWithUser } from '@/services/customers'
import { extractFieldErrors } from '@/lib/pocketbase/errors'

const formSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres'),
  telefone: z.string().min(1, 'Telefone é obrigatório'),
  cpf_cnpj: z.string().min(14, 'CPF/CNPJ incompleto'),
  endereco: z.string().min(1, 'Endereço é obrigatório'),
  tipo_cliente: z.enum(['residencial', 'comercial', 'industrial'], {
    required_error: 'Tipo de cliente é obrigatório',
  }),
})

type FormData = z.infer<typeof formSchema>

export default function CustomerNew() {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      email: '',
      senha: '',
      telefone: '',
      cpf_cnpj: '',
      endereco: '',
      tipo_cliente: 'residencial',
    },
  })

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    try {
      await createCustomerWithUser(data)
      toast.success('Cliente e usuário criados com sucesso!')
      navigate('/painel-admin') // Redireciona para o painel
    } catch (error: any) {
      const fieldErrors = extractFieldErrors(error)
      if (Object.keys(fieldErrors).length > 0) {
        Object.entries(fieldErrors).forEach(([field, message]) => {
          if (field in data) {
            setError(field as keyof FormData, { type: 'manual', message })
          } else {
            toast.error(message)
          }
        })
      } else {
        toast.error('Erro ao criar cliente', {
          description: error.message || 'Verifique os dados e tente novamente.',
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 2) return numbers
    if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
    if (numbers.length <= 10)
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`
  }

  const formatCpfCnpj = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 11) {
      if (numbers.length <= 3) return numbers
      if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`
      if (numbers.length <= 9)
        return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`
      return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`
    } else {
      if (numbers.length <= 12)
        return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8)}`
      if (numbers.length <= 14)
        return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12, 14)}`
      return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12, 14)}`
    }
  }

  const phoneRegister = register('telefone')
  const cpfCnpjRegister = register('cpf_cnpj')

  return (
    <div className="container max-w-3xl mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Cadastro de Cliente</CardTitle>
          <CardDescription>
            Preencha os dados abaixo para registrar um novo cliente. Uma conta de acesso será criada
            automaticamente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Completo / Razão Social</Label>
                  <Input id="nome" placeholder="João da Silva" {...register('nome')} />
                  {errors.nome && <p className="text-sm text-red-500">{errors.nome.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipo_cliente">Tipo de Cliente</Label>
                  <Select
                    value={watch('tipo_cliente')}
                    onValueChange={(val: any) =>
                      setValue('tipo_cliente', val, { shouldValidate: true })
                    }
                  >
                    <SelectTrigger id="tipo_cliente">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="residencial">Residencial</SelectItem>
                      <SelectItem value="comercial">Comercial</SelectItem>
                      <SelectItem value="industrial">Industrial</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.tipo_cliente && (
                    <p className="text-sm text-red-500">{errors.tipo_cliente.message}</p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="joao@exemplo.com"
                    {...register('email')}
                  />
                  {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="senha">Senha de Acesso</Label>
                  <Input
                    id="senha"
                    type="password"
                    placeholder="Min. 8 caracteres"
                    {...register('senha')}
                  />
                  {errors.senha && <p className="text-sm text-red-500">{errors.senha.message}</p>}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    placeholder="(11) 99999-9999"
                    {...phoneRegister}
                    onChange={(e) => {
                      e.target.value = formatPhone(e.target.value)
                      phoneRegister.onChange(e)
                    }}
                  />
                  {errors.telefone && (
                    <p className="text-sm text-red-500">{errors.telefone.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpf_cnpj">CPF / CNPJ</Label>
                  <Input
                    id="cpf_cnpj"
                    placeholder="000.000.000-00"
                    {...cpfCnpjRegister}
                    onChange={(e) => {
                      e.target.value = formatCpfCnpj(e.target.value)
                      cpfCnpjRegister.onChange(e)
                    }}
                  />
                  {errors.cpf_cnpj && (
                    <p className="text-sm text-red-500">{errors.cpf_cnpj.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endereco">Endereço Completo</Label>
                <Textarea
                  id="endereco"
                  placeholder="Rua Exemplo, 123 - Bairro, Cidade - UF"
                  {...register('endereco')}
                />
                {errors.endereco && (
                  <p className="text-sm text-red-500">{errors.endereco.message}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Cliente
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
