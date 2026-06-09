import { ServiceOrder, User, OrderStatus, Urgency } from '@/types'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { CalendarDays, Clock, MapPin, Wrench, Trash2, FileText } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { updateOrder, deleteOrder } from '@/services/api'
import { useToast } from '@/hooks/use-toast'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'

interface OrderDetailModalProps {
  order: ServiceOrder | null
  technicians: User[]
  onClose: () => void
  onUpdate: () => void
}

export function OrderDetailModal({ order, technicians, onClose, onUpdate }: OrderDetailModalProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const navigate = useNavigate()

  // Local state for edits
  const [status, setStatus] = useState<OrderStatus>('novo')
  const [tech, setTech] = useState<string>('')
  const [checklist, setChecklist] = useState<boolean>(false)

  useEffect(() => {
    if (order) {
      setStatus(order.status)
      setTech(order.technician || '')
      setChecklist(order.has_pending_checklist)
    }
  }, [order])

  if (!order) return null

  const handleSave = async () => {
    setLoading(true)
    try {
      await updateOrder(order.id, {
        status,
        technician: tech || undefined,
        has_pending_checklist: checklist,
      })
      toast({ title: 'OS Atualizada', description: 'As alterações foram salvas com sucesso.' })
      onUpdate()
      onClose()
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar as alterações.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir esta OS?')) return
    setLoading(true)
    try {
      await deleteOrder(order.id)
      toast({ title: 'OS Excluída', description: 'Ordem de serviço removida.' })
      onUpdate()
      onClose()
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir a OS.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const getInitials = (name: string) => (name ? name.substring(0, 2).toUpperCase() : '?')

  return (
    <Sheet open={!!order} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-md md:max-w-lg flex flex-col p-0 h-full border-l">
        <SheetHeader className="px-6 py-4 border-b bg-slate-50/50">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-xl">{order.customer_name}</SheetTitle>
              <SheetDescription>
                OS ID: <span className="font-mono">{order.id}</span>
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1 text-sm bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="text-slate-500 flex items-center gap-1">
                  <Wrench className="w-3 h-3" /> Serviço
                </span>
                <span className="font-medium text-slate-900">{order.service_type}</span>
              </div>
              <div className="flex flex-col gap-1 text-sm bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Região
                </span>
                <span className="font-medium text-slate-900">
                  {order.region || 'Não informada'}
                </span>
              </div>
              <div className="flex flex-col gap-1 text-sm bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> SLA Prazo
                </span>
                <span className="font-medium text-slate-900">
                  {new Date(order.sla_deadline).toLocaleString('pt-BR')}
                </span>
              </div>
              <div className="flex flex-col gap-1 text-sm bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="text-slate-500 flex items-center gap-1">
                  <CalendarDays className="w-3 h-3" /> Agendamento
                </span>
                <span className="font-medium text-slate-900">
                  {order.scheduled_date
                    ? new Date(order.scheduled_date).toLocaleDateString('pt-BR')
                    : 'Não agendado'}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Status da OS</Label>
              <Select value={status} onValueChange={(v: OrderStatus) => setStatus(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="novo">Novo</SelectItem>
                  <SelectItem value="qualificado">Qualificado</SelectItem>
                  <SelectItem value="orcamento">Orçamento</SelectItem>
                  <SelectItem value="aprovado">Aprovado</SelectItem>
                  <SelectItem value="agendado">Agendado</SelectItem>
                  <SelectItem value="execucao">Em Execução</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                  <SelectItem value="faturado">Faturado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Técnico Responsável</Label>
              <Select value={tech} onValueChange={setTech}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Atribuir a um técnico..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum técnico (Remover atribuição)</SelectItem>
                  {technicians.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="text-[10px]">
                            {getInitials(t.name)}
                          </AvatarFallback>
                        </Avatar>
                        {t.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2 border p-3 rounded-lg bg-slate-50/50">
              <Checkbox
                id="checklist"
                checked={checklist}
                onCheckedChange={(c) => setChecklist(!!c)}
              />
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor="checklist"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Pendências de Checklist
                </label>
                <p className="text-xs text-slate-500">
                  Marque se houverem itens obrigatórios pendentes na execução do serviço.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Descrição e Escopo</Label>
              <Textarea
                readOnly
                className="min-h-[120px] resize-none bg-slate-50 border-slate-200 text-slate-700"
                value={order.description || 'Nenhuma descrição fornecida.'}
              />
            </div>

            <div className="text-xs text-slate-400 border-t pt-4">
              Criado em {new Date(order.created).toLocaleString('pt-BR')}
            </div>
          </div>
        </ScrollArea>

        <div className="px-6 py-4 border-t bg-slate-50 flex items-center justify-between mt-auto">
          <Button
            variant="ghost"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleDelete}
            disabled={loading}
          >
            <Trash2 className="w-4 h-4 mr-2" /> Excluir
          </Button>
          <div className="flex gap-2 flex-wrap justify-end">
            <Button variant="outline" onClick={() => navigate(`/report/${order.id}`)}>
              <FileText className="w-4 h-4 mr-2" /> Laudo
            </Button>
            <Button variant="secondary" onClick={() => navigate(`/execution/${order.id}`)}>
              Executar Serviço
            </Button>
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
