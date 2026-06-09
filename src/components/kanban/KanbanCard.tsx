import { ServiceOrder } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useNavigate } from 'react-router-dom'
import { Clock, CalendarDays, FileWarning } from 'lucide-react'
import { cn } from '@/lib/utils'

interface KanbanCardProps {
  order: ServiceOrder
  onClick: (order: ServiceOrder) => void
}

export function KanbanCard({ order, onClick }: KanbanCardProps) {
  const navigate = useNavigate()
  const getSLAStatus = () => {
    if (!order.sla_deadline)
      return {
        label: 'Sem SLA',
        color: 'text-slate-500',
        border: 'border-l-slate-300',
        pulse: false,
      }

    const deadline = new Date(order.sla_deadline).getTime()
    const now = new Date().getTime()
    const diff = deadline - now
    const hoursRemaining = diff / (1000 * 60 * 60)

    if (diff < 0)
      return {
        label: 'Atrasado',
        color: 'text-red-600',
        pulse: true,
        border: 'border-l-red-600 bg-red-50/50',
      }
    if (hoursRemaining < 1)
      return {
        label: `${Math.round(hoursRemaining * 60)}m rest`,
        color: 'text-red-600',
        pulse: true,
        border: 'border-l-red-600 bg-red-50/30',
      }
    if (hoursRemaining < 2)
      return {
        label: `${Math.round(hoursRemaining * 10) / 10}h rest`,
        color: 'text-amber-600',
        pulse: true,
        border: 'border-l-amber-500 bg-amber-50/30',
      }
    return {
      label: `${Math.round(hoursRemaining)}h rest`,
      color: 'text-emerald-600',
      pulse: false,
      border: 'border-l-emerald-500',
    }
  }

  const urgencyColors: Record<string, string> = {
    crítica: 'bg-red-200 text-red-900 border-red-300 font-bold',
    média: 'bg-amber-100 text-amber-700 border-amber-200',
    baixa: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  }

  const sla = getSLAStatus()

  return (
    <Card
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('orderId', order.id)
        // Add a slight transparency to the dragged element
        setTimeout(() => {
          if (e.target instanceof HTMLElement) {
            e.target.style.opacity = '0.5'
          }
        }, 0)
      }}
      onDragEnd={(e) => {
        if (e.target instanceof HTMLElement) {
          e.target.style.opacity = '1'
        }
      }}
      onClick={() => {
        onClick(order)
        navigate(`/order/${order.id}`)
      }}
      className={cn(
        'cursor-grab active:cursor-grabbing mb-3 border-l-4 transition-all hover:shadow-md',
        sla.border,
      )}
    >
      <CardContent className="p-3">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-1.5 mb-1">
              <h4 className="font-semibold text-sm leading-tight text-slate-900">
                {order.customer_name}
              </h4>
              {order.is_rework && (
                <Badge variant="destructive" className="px-1 py-0 text-[9px] h-4 uppercase">
                  Retrabalho
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-500 line-clamp-1">{order.service_type}</p>
          </div>
          <Badge
            variant="outline"
            className={cn(
              'ml-2 px-1.5 py-0 text-[10px] capitalize shrink-0',
              urgencyColors[order.urgency] || 'bg-slate-100',
            )}
          >
            {order.urgency}
          </Badge>
        </div>

        <div className="flex items-center gap-1.5 mt-3 mb-3">
          <Clock className={cn('w-3 h-3', sla.color, sla.pulse && 'animate-pulse')} />
          <span className={cn('text-xs font-medium', sla.color, sla.pulse && 'animate-pulse')}>
            SLA: {sla.label}
          </span>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2">
            {order.expand?.technician ? (
              <Avatar className="h-6 w-6">
                {order.expand.technician.avatar && (
                  <img
                    src={`${import.meta.env.VITE_POCKETBASE_URL}/api/files/users/${order.expand.technician.id}/${order.expand.technician.avatar}`}
                    alt={order.expand.technician.name}
                    className="h-full w-full object-cover rounded-full"
                  />
                )}
                <AvatarFallback className="text-[10px] bg-slate-200 text-slate-700">
                  {order.expand.technician.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="h-6 w-6 rounded-full bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center">
                <span className="text-[10px] text-slate-400">?</span>
              </div>
            )}

            {order.scheduled_date && (
              <div className="flex items-center text-xs text-slate-500">
                <CalendarDays className="w-3 h-3 mr-1" />
                {new Date(order.scheduled_date).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            )}
          </div>

          {order.has_pending_checklist && (
            <div className="text-amber-500" title="Checklist Pendente">
              <FileWarning className="w-4 h-4" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
