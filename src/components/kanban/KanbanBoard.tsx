import { ServiceOrder, OrderStatus } from '@/types'
import { KanbanColumn } from './KanbanColumn'

interface KanbanBoardProps {
  orders: ServiceOrder[]
  onStatusChange: (orderId: string, status: OrderStatus) => void
  onCardClick: (order: ServiceOrder) => void
}

const COLUMNS: { id: OrderStatus; title: string }[] = [
  { id: 'novo', title: 'Novo' },
  { id: 'qualificado', title: 'Qualificado' },
  { id: 'orcamento', title: 'Orçamento' },
  { id: 'aprovado', title: 'Aprovado' },
  { id: 'agendado', title: 'Agendado' },
  { id: 'execucao', title: 'Em Execução' },
  { id: 'concluido', title: 'Concluído' },
  { id: 'faturado', title: 'Faturado' },
]

export function KanbanBoard({ orders, onStatusChange, onCardClick }: KanbanBoardProps) {
  return (
    <div className="flex h-full w-full gap-4 overflow-x-auto pb-4 pt-1 snap-x">
      {COLUMNS.map((col) => (
        <div key={col.id} className="snap-center h-full">
          <KanbanColumn
            status={col.id}
            title={col.title}
            orders={orders.filter((o) => o.status === col.id)}
            onDrop={onStatusChange}
            onCardClick={onCardClick}
          />
        </div>
      ))}
    </div>
  )
}
