import { ServiceOrder, OrderStatus } from '@/types'
import { KanbanCard } from './KanbanCard'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

interface KanbanColumnProps {
  status: string
  title: string
  orders: ServiceOrder[]
  onDrop: (orderId: string, status: string) => void
  onCardClick: (order: ServiceOrder) => void
}

export function KanbanColumn({ status, title, orders, onDrop, onCardClick }: KanbanColumnProps) {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.currentTarget.classList.add('bg-slate-200/80')
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('bg-slate-200/80')
  }

  const handleDrop = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('bg-slate-200/80')
    const orderId = e.dataTransfer.getData('orderId')
    if (orderId) {
      onDrop(orderId, status)
    }
  }

  return (
    <div
      className="flex flex-col w-[300px] shrink-0 bg-slate-100/80 rounded-xl border border-slate-200 shadow-sm transition-colors"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="p-3 border-b border-slate-200/60 bg-white/50 rounded-t-xl flex items-center justify-between">
        <h3 className="font-semibold text-sm text-slate-700 uppercase tracking-wider">{title}</h3>
        <Badge variant="secondary" className="bg-slate-200 text-slate-700 hover:bg-slate-200">
          {orders.length}
        </Badge>
      </div>
      <ScrollArea className="flex-1 p-2">
        <div className="min-h-[100px]">
          {orders.map((order) => (
            <KanbanCard key={order.id} order={order} onClick={onCardClick} />
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
