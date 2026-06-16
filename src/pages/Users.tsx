import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { getEmpresarios } from '@/services/empresarios'
import { getCustomers } from '@/services/customers'
import { getUsers, createUser, updateUser } from '@/services/users'
import { Customer, Empresario, User } from '@/types'
import { extractFieldErrors } from '@/lib/pocketbase/errors'
import { useRealtime } from '@/hooks/use-realtime'

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
import { Loader2, Plus, Pencil } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'

const userSchema = z
  .object({
    name: z.string().min(1, 'Nome é obrigatório'),
    email: z.string().email('Email inválido'),
    password: z.string().optional(),
    tipo_role: z.enum(['admin', 'empresario', 'tecnico', 'cliente'], {
      required_error: 'Perfil é obrigatório',
    }),
    empresa_id: z.string().optional(),
    cliente_id: z.string().optional(),
    ativo: z.boolean().default(true),
  })
  .refine(
    (data) => {
      if (['empresario', 'tecnico'].includes(data.tipo_role) && !data.empresa_id) return false
      return true
    },
    { message: 'Empresa é obrigatória', path: ['empresa_id'] },
  )
  .refine(
    (data) => {
      if (data.tipo_role === 'cliente' && !data.cliente_id) return false
      return true
    },
    { message: 'Cliente é obrigatório', path: ['cliente_id'] },
  )

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [empresarios, setEmpresarios] = useState<Empresario[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)

  const form = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      tipo_role: undefined,
      empresa_id: '',
      cliente_id: '',
      ativo: true,
    },
  })

  const watchRole = form.watch('tipo_role')

  const loadData = async () => {
    try {
      const [u, e, c] = await Promise.all([getUsers(), getEmpresarios(), getCustomers()])
      setUsers(u)
      setEmpresarios(e)
      setCustomers(c)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('users', loadData)

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user)
      form.reset({
        name: user.name || '',
        email: user.email || '',
        password: '',
        tipo_role: user.tipo_role as any,
        empresa_id: user.empresa_id || '',
        cliente_id: user.cliente_id || '',
        ativo: user.ativo,
      })
    } else {
      setEditingUser(null)
      form.reset({
        name: '',
        email: '',
        password: '',
        tipo_role: undefined,
        empresa_id: '',
        cliente_id: '',
        ativo: true,
      })
    }
    setIsModalOpen(true)
  }

  const toggleActive = async (user: User) => {
    try {
      await updateUser(user.id, { ativo: !user.ativo })
      toast.success(`Usuário ${user.ativo ? 'suspenso' : 'ativado'} com sucesso!`)
    } catch (err) {
      toast.error('Erro ao alterar status')
    }
  }

  const onSubmit = async (data: z.infer<typeof userSchema>) => {
    setIsLoading(true)
    try {
      const payload: Record<string, any> = {
        name: data.name,
        email: data.email,
        tipo_role: data.tipo_role,
        ativo: data.ativo,
        empresa_id: data.empresa_id || null,
        cliente_id: data.cliente_id || null,
      }

      if (data.password) {
        payload.password = data.password
        payload.passwordConfirm = data.password
      } else if (!editingUser) {
        form.setError('password', { message: 'Senha é obrigatória para novos usuários' })
        setIsLoading(false)
        return
      }

      if (editingUser) {
        await updateUser(editingUser.id, payload)
        toast.success('Usuário atualizado com sucesso!')
      } else {
        await createUser(payload)
        toast.success('Usuário criado com sucesso!')
      }
      setIsModalOpen(false)
    } catch (error: any) {
      const fieldErrors = extractFieldErrors(error)
      if (Object.keys(fieldErrors).length > 0) {
        Object.entries(fieldErrors).forEach(([field, message]) => {
          form.setError(field as any, { message: message as string })
        })
        toast.error('Erro de validação, verifique os campos.')
      } else {
        toast.error('Erro ao salvar usuário', { description: error.message })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Usuários</h1>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="w-4 h-4 mr-2" /> Novo Usuário
        </Button>
      </div>

      <div className="bg-white rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.name || '-'}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell className="capitalize">{u.tipo_role}</TableCell>
                <TableCell>
                  <Switch checked={u.ativo} onCheckedChange={() => toggleActive(u)} />
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => handleOpenModal(u)}>
                    <Pencil className="w-4 h-4 text-slate-600" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Nenhum usuário cadastrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
          </DialogHeader>
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
                        <Input placeholder="Ex: João" {...field} />
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
                      <FormLabel>{editingUser ? 'Nova Senha (opcional)' : 'Senha'}</FormLabel>
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
                            <SelectValue placeholder="Selecione..." />
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
                              <SelectValue placeholder="Selecione..." />
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
                              <SelectValue placeholder="Selecione..." />
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
              <div className="flex justify-end space-x-2">
                <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
