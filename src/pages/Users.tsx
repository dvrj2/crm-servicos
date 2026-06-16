import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { getEmpresarios } from '@/services/empresarios'
import { getCustomers } from '@/services/customers'
import { createUser } from '@/services/users'
import { Customer, Empresario } from '@/types'
import { extractFieldErrors } from '@/lib/pocketbase/errors'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

const userSchema = z
  .object({
    name: z.string().min(1, 'Nome é obrigatório'),
    email: z.string().email('Email inválido'),
    password: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres'),
    tipo_role: z.enum(['admin', 'empresario', 'tecnico', 'cliente'], {
      required_error: 'Perfil é obrigatório',
    }),
    empresa_id: z.string().optional(),
    cliente_id: z.string().optional(),
  })
  .refine(
    (data) => {
      if (['empresario', 'tecnico'].includes(data.tipo_role) && !data.empresa_id) {
        return false
      }
      return true
    },
    {
      message: 'Empresa é obrigatória para este perfil',
      path: ['empresa_id'],
    },
  )
  .refine(
    (data) => {
      if (data.tipo_role === 'cliente' && !data.cliente_id) {
        return false
      }
      return true
    },
    {
      message: 'Cliente é obrigatório para este perfil',
      path: ['cliente_id'],
    },
  )

export default function UsersPage() {
  const [empresarios, setEmpresarios] = useState<Empresario[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      tipo_role: undefined,
      empresa_id: '',
      cliente_id: '',
    },
  })

  const watchRole = form.watch('tipo_role')

  useEffect(() => {
    getEmpresarios().then(setEmpresarios).catch(console.error)
    getCustomers().then(setCustomers).catch(console.error)
  }, [])

  const onSubmit = async (data: z.infer<typeof userSchema>) => {
    setIsLoading(true)
    try {
      const payload: Record<string, any> = {
        name: data.name,
        email: data.email,
        password: data.password,
        passwordConfirm: data.password,
        tipo_role: data.tipo_role,
        ativo: true,
      }

      if (['empresario', 'tecnico'].includes(data.tipo_role) && data.empresa_id) {
        payload.empresa_id = data.empresa_id
      }

      if (data.tipo_role === 'cliente' && data.cliente_id) {
        payload.cliente_id = data.cliente_id
      }

      await createUser(payload)
      toast.success('Usuário criado com sucesso!')
      form.reset({
        name: '',
        email: '',
        password: '',
        tipo_role: undefined,
        empresa_id: '',
        cliente_id: '',
      })
    } catch (error: any) {
      const fieldErrors = extractFieldErrors(error)
      if (Object.keys(fieldErrors).length > 0) {
        Object.entries(fieldErrors).forEach(([field, message]) => {
          form.setError(field as any, { message: message as string })
        })
        toast.error('Erro de validação, verifique os campos.')
      } else {
        toast.error('Erro ao criar usuário', { description: error.message })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Cadastro de Usuário</CardTitle>
          <CardDescription>
            Crie um novo usuário no sistema vinculando ao perfil correto.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: João da Silva" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="joao@exemplo.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Mínimo 8 caracteres" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tipo_role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Perfil</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um perfil" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="admin">Administrador</SelectItem>
                          <SelectItem value="empresario">Empresário</SelectItem>
                          <SelectItem value="tecnico">Técnico</SelectItem>
                          <SelectItem value="cliente">Cliente</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {['empresario', 'tecnico'].includes(watchRole || '') && (
                  <FormField
                    control={form.control}
                    name="empresa_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Empresa</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione uma empresa" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {empresarios.map((emp) => (
                              <SelectItem key={emp.id} value={emp.id}>
                                {emp.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {watchRole === 'cliente' && (
                  <FormField
                    control={form.control}
                    name="cliente_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cliente</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um cliente" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {customers.map((cus) => (
                              <SelectItem key={cus.id} value={cus.id}>
                                {cus.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    'Criar Usuário'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
