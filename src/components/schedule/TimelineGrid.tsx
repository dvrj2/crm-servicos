import { User, ServiceOrder } from '@/types'
import { TimelineCell } from './TimelineCell'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { memo } from 'react'

const MemoizedCell = memo(TimelineCell)

interface Props {
  techs: User[]
  weekDates: Date[]
  orders: ServiceOrder[]
  onDropOS: (osId: string, techId: string, date: Date) => void
}

export function TimelineGrid({ techs, weekDates, orders, onDropOS }: Props) {
  const allTechs = [
    { id: '', name: 'Sem Técnico', email: '', avatar: '', capacity_diaria_hours: 24 },
    ...techs,
  ]

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-slate-200 overflow-auto shadow-sm">
      <div className="flex border-b border-slate-200 sticky top-0 z-20 bg-slate-100">
        <div className="w-[200px] shrink-0 border-r border-slate-200 p-4 font-semibold text-sm text-slate-700 sticky left-0 z-30 bg-slate-100 shadow-[1px_0_0_0_#e2e8f0]">
          Técnicos
        </div>
        {weekDates.map((date: Date, i: number) => (
          <div
            key={i}
            className="flex-1 min-w-[180px] p-4 font-semibold text-sm text-center text-slate-700 border-r border-slate-200"
          >
            {format(date, 'EEEE, dd/MM', { locale: ptBR })}
          </div>
        ))}
      </div>

      <div className="flex flex-col w-min min-w-full">
        {allTechs.map((tech) => (
          <div key={tech.id} className="flex border-b border-slate-200 group">
            <div className="w-[200px] shrink-0 border-r border-slate-200 p-4 bg-white flex flex-col justify-center sticky left-0 z-10 shadow-[1px_0_0_0_#e2e8f0] transition-colors group-hover:bg-slate-50">
              <div className="font-semibold text-sm text-slate-800 truncate">{tech.name}</div>
              {tech.id ? (
                (() => {
                  const totalHoursAssigned = orders
                    .filter((o) => o.technician === tech.id)
                    .reduce(
                      (acc, curr) =>
                        acc +
                        (curr.predicted_duration_hours || 0) +
                        (curr.displacement_min || 0) / 60,
                      0,
                    )
                  const totalCapacity = (tech.capacity_diaria_hours || 8) * weekDates.length
                  const occupancy =
                    totalCapacity > 0 ? (totalHoursAssigned / totalCapacity) * 100 : 0
                  const isOverloaded = occupancy > 85

                  return (
                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between text-[10px] font-medium text-slate-500">
                        <span>{Math.round(occupancy)}% Ocupação</span>
                        <span>{tech.capacity_diaria_hours || 8}h/dia</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${isOverloaded ? 'bg-red-500' : 'bg-primary'}`}
                          style={{ width: `${Math.min(occupancy, 100)}%` }}
                        />
                      </div>
                    </div>
                  )
                })()
              ) : (
                <div className="text-xs text-slate-400 mt-1">Fila de Espera</div>
              )}
            </div>
            {weekDates.map((date: Date, i: number) => (
              <div key={i} className="flex-1 min-w-[180px]">
                <MemoizedCell tech={tech} date={date} orders={orders} onDropOS={onDropOS} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
