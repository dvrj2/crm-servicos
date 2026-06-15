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

const schema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  cpf_cnpj: z.string().min(1, 'CPF/CNPJ é obrigatório'),
  email: z.string().email('Email inválido'),
  telefone: z.string().optional(),
  endereco: z.string().optional(),
  area_de_atuacao: z.string().optional(),
  registro_profissional: z.string().optional(),
  certificacoes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const textFields = [
  { name: 'nome', label: 'Nome *' },
  { name: 'cpf_cnpj', label: 'CPF/CNPJ *' },
  { name: 'email', label: 'E-mail *' },
  { name: 'telefone', label: 'Telefone' },
  { name: 'endereco', label: 'Endereço' },
  { name: 'area_de_atuacao', label: 'Área de Atuação' },
  { name: 'registro_profissional', label: 'Registro Profissional (CREA, etc.)' },
] as const

export function EmpresarioForm({
  initialData,
  onSubmit,
  isSubmitting,
}: {
  initialData?: Empresario | null
  onSubmit: (data: globalThis.FormData) => Promise<void>
  isSubmitting: boolean
}) {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: initialData?.nome || '',
      cpf_cnpj: initialData?.cpf_cnpj || '',
      email: initialData?.email || '',
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
          {textFields.map((f) => (
            <FormField
              key={f.name}
              control={form.control}
              name={f.name}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{f.label}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
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
            {isSubmitting ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
