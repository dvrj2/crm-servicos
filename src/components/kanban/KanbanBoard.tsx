import { ServiceOrder, OrderStatus } from '@/types'
import { KanbanColumn } from './KanbanColumn'
import { useToast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/pocketbase/errors'

interface KanbanBoardProps {
  orders: ServiceOrder[]
  onStatusChange: (orderId: string, status: string) => Promise<void> | void
  onCardClick: (order: ServiceOrder) => void
}

const COLUMNS = [
  { id: 'novo', title: 'Novo' },
  { id: 'qualificado', title: 'Qualificado' },
  { id: 'orçamento', title: 'Orçamento' },
  { id: 'aprovado', title: 'Aprovado' },
  { id: 'agendado', title: 'Agendado' },
  { id: 'executando', title: 'Em Execução' },
  { id: 'concluído', title: 'Concluído' },
  { id: 'faturado', title: 'Faturado' },
]

export function KanbanBoard({ orders, onStatusChange, onCardClick }: KanbanBoardProps) {
  const { toast } = useToast()

  const handleDrop = async (orderId: string, status: string) => {
    try {
      await Promise.resolve(onStatusChange(orderId, status))
    } catch (err: any) {
      toast({
        title: 'Não foi possível mover o card',
        description: getErrorMessage(err),
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="flex h-full w-full gap-4 overflow-x-auto pb-4 pt-1 snap-x">
      {COLUMNS.map((col) => {
        let colOrders = []
        if (col.id === 'faturado') {
          colOrders = orders.filter((o) => o.status === 'concluído' && o.payment_status === 'pago')
        } else if (col.id === 'concluído') {
          colOrders = orders.filter((o) => o.status === 'concluído' && o.payment_status !== 'pago')
        } else {
          colOrders = orders.filter((o) => o.status === col.id)
        }

        return (
          <div key={col.id} className="snap-center h-full">
            <KanbanColumn
              status={col.id as any}
              title={col.title}
              orders={colOrders}
              onDrop={handleDrop}
              onCardClick={onCardClick}
            />
          </div>
        )
      })}
    </div>
  )
}
