import { useEffect, useState, useMemo } from 'react'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { ServiceOrder, User } from '@/types'
import { differenceInDays, parseISO } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DollarSign,
  Copy,
  RefreshCw,
  ExternalLink,
  Activity,
  AlertCircle,
  MoreHorizontal,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export default function Finance() {
  const [orders, setOrders] = useState<ServiceOrder[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const [filters, setFilters] = useState({
    period: '30',
    technician: 'all',
    serviceType: 'all',
  })

  const loadData = async () => {
    try {
      const [usersRes, ordersRes] = await Promise.all([
        pb.collection('users').getFullList(),
        pb.collection('service_orders').getFullList({
          filter: `status = 'concluído'`,
          expand: 'technician',
          sort: '-updated',
        }),
      ])
      setUsers(usersRes as unknown as User[])
      setOrders(ordersRes as unknown as ServiceOrder[])
    } catch (e) {
      console.error('Failed to load finance data:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('service_orders', () => {
    loadData()
  })

  useRealtime('financials', () => {
    loadData()
  })

  const serviceTypes = useMemo(() => {
    const types = new Set(orders.map((o) => o.service_type).filter(Boolean))
    return Array.from(types)
  }, [orders])

  const filteredOrders = useMemo(() => {
    const now = new Date()
    const daysLimit = filters.period === 'all' ? 9999 : parseInt(filters.period, 10)

    return orders.filter((o) => {
      const orderDate = o.finished_at ? parseISO(o.finished_at) : parseISO(o.updated)
      const inPeriod = differenceInDays(now, orderDate) <= daysLimit
      const matchTech = filters.technician === 'all' || o.technician === filters.technician
      const matchType = filters.serviceType === 'all' || o.service_type === filters.serviceType

      return inPeriod && matchTech && matchType
    })
  }, [orders, filters])

  const totalRevenue = filteredOrders.reduce((acc, o) => acc + (o.final_value || 0), 0)
  const ticketMedio = filteredOrders.length ? totalRevenue / filteredOrders.length : 0

  const recorrentes = filteredOrders.filter((o) => o.is_recurring)
  const recorrenciaPct = filteredOrders.length
    ? (recorrentes.length / filteredOrders.length) * 100
    : 0

  const inadimplentes = filteredOrders.filter(
    (o) => o.payment_status === 'vencido' || o.payment_status === 'pendente',
  )
  const inadimplentesValue = inadimplentes.reduce((acc, o) => acc + (o.final_value || 0), 0)
  const inadimplentesCount = inadimplentes.length

  const formatCurrency = (value?: number) => {
    if (value === undefined || value === null) return 'R$ 0,00'
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  const formatMargin = (value?: number) => {
    if (value === undefined || value === null) return '-'
    return `${value}%`
  }

  const handleCopy = (link: string) => {
    navigator.clipboard.writeText(link)
    toast({
      title: 'Link copiado!',
      description: 'O link de pagamento foi copiado para a área de transferência.',
    })
  }

  const updateFinancialStatus = async (orderId: string, status: string) => {
    try {
      const fin = await pb.collection('financials').getFirstListItem(`service_order = "${orderId}"`)
      await pb.collection('financials').update(fin.id, { payment_status: status })
      toast({ title: 'Sucesso', description: `Status de pagamento atualizado para ${status}` })
      loadData()
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o status financeiro.',
        variant: 'destructive',
      })
    }
  }

  const getPaymentBadge = (status?: string) => {
    switch (status) {
      case 'pago':
        return (
          <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200">
            Pago
          </Badge>
        )
      case 'pendente':
        return (
          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200">
            Pendente
          </Badge>
        )
      case 'vencido':
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-red-200">Vencido</Badge>
        )
      case 'erro':
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-red-200">Erro</Badge>
        )
      default:
        return <Badge variant="secondary">Não definido</Badge>
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full pb-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Financeiro Operacional</h1>
        <p className="text-muted-foreground">
          Monitore a saúde financeira, margens de lucro e inadimplência das ordens concluídas.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Faturamento Total</CardTitle>
            <DollarSign className="w-4 h-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-slate-500 mt-1">Baseado nas OSs concluídas e filtradas</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <Activity className="w-4 h-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{formatCurrency(ticketMedio)}</div>
            <p className="text-xs text-slate-500 mt-1">Média por OS concluída</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Recorrência</CardTitle>
            <RefreshCw className="w-4 h-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{recorrenciaPct.toFixed(1)}%</div>
            <p className="text-xs text-slate-500 mt-1">{recorrentes.length} OS(s) recorrentes</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-amber-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-amber-800">Inadimplentes</CardTitle>
            <AlertCircle className="w-4 h-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700">
              {formatCurrency(inadimplentesValue)}
            </div>
            <p className="text-xs text-amber-700/80 mt-1">
              {inadimplentesCount} OS(s) pendentes ou vencidas
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50/50 rounded-lg">
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1.5 block">
              Período de Conclusão
            </label>
            <Select
              value={filters.period}
              onValueChange={(v) => setFilters((p) => ({ ...p, period: v }))}
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
                <SelectItem value="all">Todo o período</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 mb-1.5 block">Técnico</label>
            <Select
              value={filters.technician}
              onValueChange={(v) => setFilters((p) => ({ ...p, technician: v }))}
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Técnicos</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 mb-1.5 block">
              Tipo de Serviço
            </label>
            <Select
              value={filters.serviceType}
              onValueChange={(v) => setFilters((p) => ({ ...p, serviceType: v }))}
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Serviços</SelectItem>
                {serviceTypes.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-md border bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="w-[250px]">Cliente / OS</TableHead>
              <TableHead>Serviço</TableHead>
              <TableHead>Valor Final</TableHead>
              <TableHead>Margens</TableHead>
              <TableHead>Status Pgto.</TableHead>
              <TableHead className="text-right">Link de Pagamento</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Skeleton className="h-4 w-64" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  Nenhuma ordem financeira encontrada para os filtros selecionados.
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => {
                const isLowerMargin =
                  typeof order.actual_margin === 'number' &&
                  typeof order.planned_margin === 'number' &&
                  order.actual_margin < order.planned_margin

                return (
                  <TableRow key={order.id} className="hover:bg-slate-50/50">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-900">{order.customer_name}</span>
                        <span className="text-xs text-slate-500 uppercase tracking-wider">
                          ID: {order.id.slice(0, 8)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{order.service_type}</span>
                        <span className="text-xs text-slate-500">
                          {order.expand?.technician?.name || 'Sem Técnico'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col items-start gap-1.5">
                        <span className="font-semibold text-slate-900">
                          {formatCurrency(order.final_value)}
                        </span>
                        {order.is_recurring && (
                          <Badge
                            variant="outline"
                            className="text-[10px] h-5 px-1.5 bg-blue-50 text-blue-700 border-blue-200"
                          >
                            <RefreshCw className="w-3 h-3 mr-1" /> Recorrente
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 bg-slate-50 p-2 rounded border border-slate-100">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500">Prevista:</span>
                          <span className="font-medium text-slate-700">
                            {formatMargin(order.planned_margin)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500">Real:</span>
                          <span
                            className={cn(
                              'font-bold',
                              isLowerMargin ? 'text-red-600' : 'text-emerald-600',
                            )}
                          >
                            {formatMargin(order.actual_margin)}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getPaymentBadge(order.payment_status)}</TableCell>
                    <TableCell className="text-right">
                      {order.payment_link ? (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopy(order.payment_link!)}
                            className="h-8 text-xs font-medium"
                          >
                            <Copy className="w-3.5 h-3.5 mr-1.5" /> Copiar
                          </Button>
                          <a
                            href={order.payment_link}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center w-8 h-8 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                            title="Abrir link"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs italic">Sem link gerado</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menu</span>
                            <MoreHorizontal className="h-4 w-4 text-slate-500" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => updateFinancialStatus(order.id, 'pago')}>
                            Marcar como Pago
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateFinancialStatus(order.id, 'erro')}>
                            Sinalizar Erro
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
