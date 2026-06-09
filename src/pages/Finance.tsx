import { useState, useEffect, useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
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
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { useRealtime } from '@/hooks/use-realtime'
import { ServiceOrder } from '@/types'
import pb from '@/lib/pocketbase/client'
import { toast } from '@/hooks/use-toast'
import { AlertTriangle, Send, RefreshCw, FileUp, CalendarDays, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Finance() {
  const [orders, setOrders] = useState<ServiceOrder[]>([])
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<ServiceOrder | null>(null)
  const [paymentFile, setPaymentFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const [period, setPeriod] = useState<number>(30)
  const [paymentFilter, setPaymentFilter] = useState<string>('all')
  const [techFilter, setTechFilter] = useState<string>('all')
  const [serviceTypeFilter, setServiceTypeFilter] = useState<string>('all')
  const [marginFilter, setMarginFilter] = useState<string>('all')

  const fetchOrders = async () => {
    try {
      const records = await pb.collection('service_orders').getFullList({
        expand: 'technician',
        filter: 'status = "concluido" || status = "faturado"',
        sort: '-finished_at',
      })
      setOrders(records as unknown as ServiceOrder[])
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  useRealtime('service_orders', () => fetchOrders())

  const customerDelays = useMemo(() => {
    const map: Record<string, number> = {}
    orders.forEach((o) => {
      if (o.payment_status === 'vencido') {
        map[o.customer_name] = (map[o.customer_name] || 0) + 1
      }
    })
    return map
  }, [orders])

  const filteredOrders = useMemo(() => {
    const now = new Date()
    return orders.filter((o) => {
      const finishedAt = o.finished_at ? new Date(o.finished_at) : new Date(o.updated)
      const daysDiff = (now.getTime() - finishedAt.getTime()) / (1000 * 3600 * 24)
      if (daysDiff > period) return false

      if (paymentFilter !== 'all' && o.payment_status !== paymentFilter) return false
      if (techFilter !== 'all' && o.technician !== techFilter) return false
      if (serviceTypeFilter !== 'all' && o.service_type !== serviceTypeFilter) return false

      if (marginFilter !== 'all') {
        const margin = o.actual_margin || 0
        if (marginFilter === 'negativa' && margin >= 0) return false
        if (marginFilter === 'baixa' && (margin < 0 || margin > 15)) return false
        if (marginFilter === 'alta' && margin <= 15) return false
      }

      return true
    })
  }, [orders, period, paymentFilter, techFilter, serviceTypeFilter, marginFilter])

  const kpis = useMemo(() => {
    const totalRevenue = filteredOrders.reduce((acc, o) => acc + (o.final_value || 0), 0)
    const averageTicket = filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0
    const paidCount = filteredOrders.filter((o) => o.payment_status === 'pago').length
    const paidPercentage = filteredOrders.length > 0 ? (paidCount / filteredOrders.length) * 100 : 0
    const vencidoCount = filteredOrders.filter((o) => o.payment_status === 'vencido').length
    const defaultRate = filteredOrders.length > 0 ? (vencidoCount / filteredOrders.length) * 100 : 0
    const totalMargin = filteredOrders.reduce((acc, o) => acc + (o.actual_margin || 0), 0)
    const avgMargin = filteredOrders.length > 0 ? totalMargin / filteredOrders.length : 0

    return { totalRevenue, averageTicket, paidPercentage, avgMargin, defaultRate }
  }, [filteredOrders])

  const formatCurrency = (val?: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)
  }

  const sendWhatsApp = (order: ServiceOrder) => {
    const link = order.payment_link || 'Link não disponível'
    const val = formatCurrency(order.final_value || 0)
    const text = encodeURIComponent(
      `Olá ${order.customer_name}, segue o resumo e link para pagamento do serviço de ${order.service_type}.
💰 *Valor Final:* ${val}
💳 *Link para pagamento:* ${link}

Agradecemos a confiança em nossos serviços!`,
    )
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  const handleRecurrence = async (order: ServiceOrder) => {
    try {
      await pb.collection('service_orders').create({
        customer_name: order.customer_name,
        service_type: order.service_type,
        urgency: 'media',
        sla_deadline: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
        region: order.region,
        status: 'novo',
        has_pending_checklist: true,
        description: `Manutenção preventiva gerada a partir da OS ${order.id}`,
      })
      toast({
        title: 'Recorrência gerada',
        description: 'Nova OS de preventiva criada com sucesso.',
      })
    } catch (e) {
      toast({ title: 'Erro', description: 'Erro ao gerar recorrência.', variant: 'destructive' })
    }
  }

  const submitPaymentProof = async () => {
    if (!paymentFile || !selectedOrderForPayment) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('payment_proof', paymentFile)
      await pb.collection('service_orders').update(selectedOrderForPayment.id, fd)
      toast({ title: 'Sucesso', description: 'Comprovante anexado e pagamento registrado.' })
      setSelectedOrderForPayment(null)
      setPaymentFile(null)
    } catch (err: any) {
      const msg = err?.response?.message || 'Falha ao registrar pagamento'
      toast({ title: 'Erro', description: msg, variant: 'destructive' })
    } finally {
      setUploading(false)
    }
  }

  const technicians = useMemo(() => {
    const unique = new Map()
    orders.forEach((o) => {
      if (o.expand?.technician) unique.set(o.technician, o.expand.technician.name)
    })
    return Array.from(unique.entries())
  }, [orders])

  const serviceTypes = useMemo(() => {
    return Array.from(new Set(orders.map((o) => o.service_type).filter(Boolean)))
  }, [orders])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Financeiro Operacional</h2>
        <p className="text-muted-foreground">Acompanhamento de receitas, margens e inadimplência</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Receita Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {formatCurrency(kpis.totalRevenue)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Ticket Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {formatCurrency(kpis.averageTicket)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Pagamentos em Dia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {kpis.paidPercentage.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Margem Operacional</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                'text-2xl font-bold',
                kpis.avgMargin < 0 ? 'text-red-600' : 'text-slate-900',
              )}
            >
              {kpis.avgMargin.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Inadimplência</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                'text-2xl font-bold',
                kpis.defaultRate > 10 ? 'text-red-600' : 'text-slate-900',
              )}
            >
              {kpis.defaultRate.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white p-4 rounded-lg border shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Label className="text-xs mb-1 block">Período</Label>
          <Select value={period.toString()} onValueChange={(v) => setPeriod(Number(v))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <Label className="text-xs mb-1 block">Status Pgto.</Label>
          <Select value={paymentFilter} onValueChange={setPaymentFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pago">Pago</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="vencido">Vencido</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <Label className="text-xs mb-1 block">Técnico</Label>
          <Select value={techFilter} onValueChange={setTechFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {technicians.map(([id, name]) => (
                <SelectItem key={id} value={id}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <Label className="text-xs mb-1 block">Tipo de Serviço</Label>
          <Select value={serviceTypeFilter} onValueChange={setServiceTypeFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {serviceTypes.map((st) => (
                <SelectItem key={st} value={st}>
                  {st}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <Label className="text-xs mb-1 block">Margem</Label>
          <Select value={marginFilter} onValueChange={setMarginFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="alta">Alta (&gt; 15%)</SelectItem>
              <SelectItem value="baixa">Baixa (0 - 15%)</SelectItem>
              <SelectItem value="negativa">Negativa (&lt; 0%)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status Pgto</TableHead>
              <TableHead>Margem (Prev / Real)</TableHead>
              <TableHead>Conclusão</TableHead>
              <TableHead>Serviço</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-slate-500">
                  Nenhum registro encontrado para os filtros atuais.
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900">{o.customer_name}</span>
                      {customerDelays[o.customer_name] >= 3 && (
                        <Badge
                          variant="destructive"
                          className="h-5 px-1.5 text-[10px] uppercase gap-1 bg-red-100 text-red-700 hover:bg-red-100 border-none"
                        >
                          <AlertTriangle className="w-3 h-3" /> Risco
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{formatCurrency(o.final_value)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        o.payment_status === 'pago'
                          ? 'default'
                          : o.payment_status === 'vencido'
                            ? 'destructive'
                            : 'secondary'
                      }
                      className={cn(
                        o.payment_status === 'pago' &&
                          'bg-green-100 text-green-700 hover:bg-green-100 border-none',
                        o.payment_status === 'pendente' &&
                          'bg-amber-100 text-amber-700 hover:bg-amber-100 border-none',
                        o.payment_status === 'vencido' &&
                          'bg-red-100 text-red-700 hover:bg-red-100 border-none',
                        'capitalize',
                      )}
                    >
                      {o.payment_status || 'pendente'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-slate-500">{o.planned_margin ?? '-'}%</span>
                      <span className="text-slate-300">/</span>
                      <span
                        className={cn(
                          'font-semibold',
                          (o.actual_margin || 0) < 0 ? 'text-red-600' : 'text-emerald-600',
                        )}
                      >
                        {o.actual_margin ?? '-'}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-500">
                    {o.finished_at ? new Date(o.finished_at).toLocaleDateString('pt-BR') : '-'}
                  </TableCell>
                  <TableCell className="text-slate-500">{o.service_type}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-500 hover:text-slate-900"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => sendWhatsApp(o)}>
                          <Send className="w-4 h-4 mr-2 text-green-600" /> Enviar WhatsApp
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            toast({
                              title: 'Fatura reenviada',
                              description: 'A fatura foi reenviada ao cliente.',
                            })
                          }}
                        >
                          <RefreshCw className="w-4 h-4 mr-2 text-blue-600" /> Reenviar Fatura
                        </DropdownMenuItem>
                        {o.payment_status !== 'pago' && (
                          <DropdownMenuItem onClick={() => setSelectedOrderForPayment(o)}>
                            <FileUp className="w-4 h-4 mr-2 text-emerald-600" /> Registrar Pagamento
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleRecurrence(o)}>
                          <CalendarDays className="w-4 h-4 mr-2 text-indigo-600" /> Gerar
                          Recorrência
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={!!selectedOrderForPayment}
        onOpenChange={(v) => !v && setSelectedOrderForPayment(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pagamento Manual</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Comprovante (Imagem/PDF)</Label>
              <Input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setPaymentFile(e.target.files?.[0] || null)}
              />
              <p className="text-xs text-slate-500">
                Ao enviar o comprovante, o status será atualizado para "Pago" automaticamente.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setSelectedOrderForPayment(null)}
                disabled={uploading}
              >
                Cancelar
              </Button>
              <Button onClick={submitPaymentProof} disabled={uploading || !paymentFile}>
                {uploading ? 'Enviando...' : 'Salvar Pagamento'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
