import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import type { Tecnico } from '@/types'

const schema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF inválido (ex: 111.111.111-11)'),
  email: z.string().email('E-mail inválido'),
  telefone: z.string().optional(),
  regiao: z.string().optional(),
  certificacoes: z.string().optional(),
  capacidade_diaria_hours: z.coerce.number().min(0).optional(),
  ocupacao_atual_horas: z.coerce.number().min(0).optional(),
  status: z.enum(['disponível', 'a caminho', 'em serviço']).optional(),
  habilidades: z.string().optional(),
  custo_hora: z.coerce.number().min(0).optional(),
})

type FormData = z.infer<typeof schema>

interface TecnicoFormProps {
  initialData?: Tecnico | null
  onSubmit: (data: Partial<Tecnico>) => Promise<void>
  onCancel: () => void
}

export function TecnicoForm({ initialData, onSubmit, onCancel }: TecnicoFormProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: initialData?.nome || '',
      cpf: initialData?.cpf || '',
      email: initialData?.email || '',
      telefone: initialData?.telefone || '',
      regiao: initialData?.regiao || '',
      certificacoes: initialData?.certificacoes || '',
      capacidade_diaria_hours: initialData?.capacidade_diaria_hours || 8,
      ocupacao_atual_horas: initialData?.ocupacao_atual_horas || 0,
      status: initialData?.status || 'disponível',
      habilidades: initialData?.habilidades || '',
      custo_hora: initialData?.custo_hora || 0,
    },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="nome"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="cpf"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CPF</FormLabel>
                <FormControl>
                  <Input placeholder="111.111.111-11" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="regiao"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Região</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="disponível">Disponível</SelectItem>
                    <SelectItem value="a caminho">A Caminho</SelectItem>
                    <SelectItem value="em serviço">Em Serviço</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="capacidade_diaria_hours"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Capacidade Diária (h)</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="ocupacao_atual_horas"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ocupação Atual (h)</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="custo_hora"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Custo Hora (R$)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="certificacoes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Certificações</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: NR10, NR35" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="habilidades"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Habilidades</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit">Salvar</Button>
        </div>
      </form>
    </Form>
  )
}
