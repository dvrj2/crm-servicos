import { useEffect, useState, useMemo } from 'react'
import { getServiceOrders, getTechnicians, updateOrderStatus } from '@/services/api'
import { ServiceOrder, User, OrderStatus } from '@/types'
import { useRealtime } from '@/hooks/use-realtime'
import { KanbanBoard } from '@/components/kanban/KanbanBoard'
import { OrderDetailModal } from '@/components/kanban/OrderDetailModal'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

export default function Index() {
  const [orders, setOrders] = useState<ServiceOrder[]>([])
  const [technicians, setTechnicians] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null)
  const { toast } = useToast()

  // Filters
  const [fTech, setFTech] = useState<string>('_all')
  const [fUrg, setFUrg] = useState<string>('_all')

  const loadData = async () => {
    try {
      const [oData, tData] = await Promise.all([getServiceOrders(), getTechnicians()])
      setOrders(oData)
      setTechnicians(tData)
    } catch (err) {
      toast({
        title: 'Erro de Conexão',
        description: 'Não foi possível carregar os dados.',
        variant: 'destructive',
      })
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

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (fTech !== '_all' && o.technician !== fTech) return false
      if (fUrg !== '_all' && o.urgency !== fUrg) return false
      return true
    })
  }, [orders, fTech, fUrg])

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    const order = orders.find((o) => o.id === orderId)
    if (!order || order.status === newStatus) return

    // Optimistic update
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)))

    try {
      await updateOrderStatus(orderId, newStatus)
    } catch (err) {
      // Revert on failure
      loadData()
      toast({ title: 'Erro', description: 'Não foi possível mover a OS.', variant: 'destructive' })
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Visão Geral da Operação
          </h2>
          <p className="text-sm text-slate-500">
            Acompanhe e gerencie ordens de serviço em tempo real.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={fTech} onValueChange={setFTech}>
            <SelectTrigger className="w-[180px] bg-white">
              <SelectValue placeholder="Técnico" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Todos os Técnicos</SelectItem>
              {technicians.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={fUrg} onValueChange={setFUrg}>
            <SelectTrigger className="w-[150px] bg-white">
              <SelectValue placeholder="Urgência" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Qualquer Urgência</SelectItem>
              <SelectItem value="alta">Alta (Vermelho)</SelectItem>
              <SelectItem value="media">Média (Amarelo)</SelectItem>
              <SelectItem value="baixa">Baixa (Verde)</SelectItem>
            </SelectContent>
          </Select>

          {(fTech !== '_all' || fUrg !== '_all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFTech('_all')
                setFUrg('_all')
              }}
              className="text-xs"
            >
              Limpar Filtros
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <KanbanBoard
            orders={filteredOrders}
            onStatusChange={handleStatusChange}
            onCardClick={setSelectedOrder}
          />
        )}
      </div>

      <OrderDetailModal
        order={selectedOrder}
        technicians={technicians}
        onClose={() => setSelectedOrder(null)}
        onUpdate={loadData}
      />
    </div>
  )
}
