import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import type { Empresario } from '@/types'

export function EmpresarioForm({
  initialData,
  onSubmit,
  isSubmitting,
}: {
  initialData?: Empresario | null
  onSubmit: (data: globalThis.FormData) => Promise<void>
  isSubmitting: boolean
}) {
  const isEditing = !!initialData

  const schema = z.object({
    nome: z.string().min(1, 'Nome é obrigatório'),
    cpf_cnpj: z.string().min(1, 'CPF/CNPJ é obrigatório'),
    email: z.string().email('Email inválido'),
    senha: isEditing
      ? z.string().optional()
      : z.string().min(8, 'A senha deve ter no mínimo 8 caracteres'),
    telefone: z.string().optional(),
    endereco: z.string().optional(),
    area_de_atuacao: z.string().optional(),
    registro_profissional: z.string().optional(),
    certificacoes: z.string().optional(),
  })

  type FormData = z.infer<typeof schema>

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: initialData?.nome || '',
      cpf_cnpj: initialData?.cpf_cnpj || '',
      email: initialData?.email || '',
      senha: '',
      telefone: initialData?.telefone || '',
      endereco: initialData?.endereco || '',
      area_de_atuacao: initialData?.area_de_atuacao || '',
      registro_profissional: initialData?.registro_profissional || '',
      certificacoes: initialData?.certificacoes || '',
    },
  })

  useEffect(() => {
    if (initialData) {
      form.reset({
        nome: initialData.nome || '',
        cpf_cnpj: initialData.cpf_cnpj || '',
        email: initialData.email || '',
        senha: '',
        telefone: initialData.telefone || '',
        endereco: initialData.endereco || '',
        area_de_atuacao: initialData.area_de_atuacao || '',
        registro_profissional: initialData.registro_profissional || '',
        certificacoes: initialData.certificacoes || '',
      })
    } else {
      form.reset({
        nome: '',
        cpf_cnpj: '',
        email: '',
        senha: '',
        telefone: '',
        endereco: '',
        area_de_atuacao: '',
        registro_profissional: '',
        certificacoes: '',
      })
    }
    setFile(null)
  }, [initialData, form])

  const [file, setFile] = useState<File | null>(null)

  const handleSubmit = async (values: FormData) => {
    const formData = new globalThis.FormData()
    Object.entries(values).forEach(([key, value]) => {
      if (value) formData.append(key, value)
    })
    if (file) {
      formData.append('documento_identificacao', file)
    }
    await onSubmit(formData)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="nome"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome *</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="cpf_cnpj"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CPF/CNPJ *</FormLabel>
                <FormControl>
                  <Input {...field} />
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
                <FormLabel>E-mail *</FormLabel>
                <FormControl>
                  <Input type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {!isEditing && (
            <FormField
              control={form.control}
              name="senha"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha *</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          <FormField
            control={form.control}
            name="telefone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="endereco"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Endereço</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="area_de_atuacao"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Área de Atuação</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="registro_profissional"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Registro Profissional (CREA, etc.)</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="certificacoes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Certificações</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Liste as certificações aqui..."
                  className="resize-none"
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div>
          <Label>Documento de Identificação</Label>
          <Input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="mt-1"
          />
          {initialData?.documento_identificacao && !file && (
            <p className="text-sm text-muted-foreground mt-1">
              Arquivo atual: {initialData.documento_identificacao}
            </p>
          )}
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : isEditing ? 'Salvar' : 'Criar Empresário'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
