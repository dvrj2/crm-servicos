import { useState, useEffect, useMemo } from 'react'
import { KanbanBoard } from '@/components/kanban/KanbanBoard'
import { ServiceOrder, User } from '@/types'
import { getServiceOrders, getTechnicians, updateOrder } from '@/services/api'
import { useRealtime } from '@/hooks/use-realtime'
import { useNavigate, Navigate, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function Index() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<ServiceOrder[]>([])
  const [technicians, setTechnicians] = useState<User[]>([])
  const navigate = useNavigate()

  // filters
  const [techFilter, setTechFilter] = useState('all')
  const [urgencyFilter, setUrgencyFilter] = useState('all')
  const [regionFilter, setRegionFilter] = useState('all')
  const [slaFilter, setSlaFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  const loadData = async () => {
    try {
      const [fetchedOrders, fetchedTechs] = await Promise.all([
        getServiceOrders(),
        getTechnicians(),
      ])
      setOrders(fetchedOrders)
      setTechnicians(fetchedTechs)
    } catch (e) {
      console.error('Failed to load data', e)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('service_orders', () => {
    loadData()
  })

  // get unique values for filters
  const regions = useMemo(
    () => Array.from(new Set(orders.map((o) => o.region).filter(Boolean))),
    [orders],
  )
  const serviceTypes = useMemo(
    () => Array.from(new Set(orders.map((o) => o.service_type).filter(Boolean))),
    [orders],
  )

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (techFilter !== 'all' && o.technician !== techFilter) return false
      if (urgencyFilter !== 'all' && o.urgency !== urgencyFilter) return false
      if (regionFilter !== 'all' && o.region !== regionFilter) return false
      if (typeFilter !== 'all' && o.service_type !== typeFilter) return false

      if (slaFilter !== 'all' && o.sla_deadline) {
        const deadline = new Date(o.sla_deadline).getTime()
        const now = new Date().getTime()
        const diff = deadline - now
        if (slaFilter === 'atrasado' && diff >= 0) return false
        if (slaFilter === 'critico' && (diff < 0 || diff > 60 * 60 * 1000)) return false
      }

      return true
    })
  }, [orders, techFilter, urgencyFilter, regionFilter, slaFilter, typeFilter])

  const handleStatusChange = async (orderId: string, newColumnId: string) => {
    let updates: Partial<ServiceOrder> = {}
    if (newColumnId === 'faturado') {
      updates = { status: 'concluído', payment_status: 'pago' }
    } else if (newColumnId === 'concluído') {
      updates = { status: 'concluído', payment_status: 'pendente' }
    } else {
      updates = { status: newColumnId as any }
    }

    // optimistic update
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, ...updates } : o)))

    try {
      await updateOrder(orderId, updates)
    } catch (e) {
      loadData()
    }
  }

  const handleCardClick = (order: ServiceOrder) => {
    navigate(`/execution/${order.id}`)
  }

  if (user && user.tipo_role !== 'admin') {
    if (user.tipo_role === 'empresario') return <Navigate to="/indicators" replace />
    if (user.tipo_role === 'tecnico') return <Navigate to="/schedule" replace />
    if (user.tipo_role === 'cliente') return <Navigate to="/customer-portal" replace />

    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[60vh] p-4 text-center">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Acesso Negado</h1>
        <p className="text-slate-500 mb-8 max-w-md">
          Você não tem permissão para acessar o painel administrativo.
        </p>
        <Button asChild>
          <Link to="/login">Voltar para o Login</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full space-y-4 p-4 md:p-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Painel Operacional</h1>
      </div>

      <div className="flex flex-wrap gap-4 bg-white p-4 rounded-lg shadow-sm border border-slate-200">
        <div className="w-[200px]">
          <label className="text-xs font-medium text-slate-500 mb-1 block">Técnico</label>
          <Select value={techFilter} onValueChange={setTechFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Todos os Técnicos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Técnicos</SelectItem>
              {technicians.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-[150px]">
          <label className="text-xs font-medium text-slate-500 mb-1 block">Urgência</label>
          <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="baixa">Baixa</SelectItem>
              <SelectItem value="média">Média</SelectItem>
              <SelectItem value="crítica">Crítica</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-[150px]">
          <label className="text-xs font-medium text-slate-500 mb-1 block">Região</label>
          <Select value={regionFilter} onValueChange={setRegionFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {regions.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-[150px]">
          <label className="text-xs font-medium text-slate-500 mb-1 block">SLA</label>
          <Select value={slaFilter} onValueChange={setSlaFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="atrasado">Atrasados</SelectItem>
              <SelectItem value="critico">Críticos (&lt; 1h)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-[200px]">
          <label className="text-xs font-medium text-slate-500 mb-1 block">Tipo de Serviço</label>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
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
      </div>

      <div className="flex-1 overflow-hidden min-h-[500px]">
        <KanbanBoard
          orders={filteredOrders}
          onStatusChange={handleStatusChange}
          onCardClick={handleCardClick}
        />
      </div>
    </div>
  )
}
