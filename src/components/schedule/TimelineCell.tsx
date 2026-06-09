import React from 'react'
import { ServiceOrder, User } from '@/types'
import { isSameDay } from 'date-fns'
import { OSCard } from './OSCard'
import { cn } from '@/lib/utils'
import { AlertTriangle, MapPin } from 'lucide-react'

interface Props {
  tech: User
  date: Date
  orders: ServiceOrder[]
  onDropOS: (osId: string, techId: string, date: Date) => void
}

export function TimelineCell({ tech, date, orders, onDropOS }: Props) {
  const dayOrders = orders.filter(
    (o) =>
      o.technician === tech.id && o.scheduled_date && isSameDay(new Date(o.scheduled_date), date),
  )

  const sorted = [...dayOrders].sort(
    (a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime(),
  )

  const conflicts = new Set<string>()
  for (let i = 0; i < sorted.length; i++) {
    const startI = new Date(sorted[i].scheduled_date).getTime()
    const endI = startI + (sorted[i].predicted_duration_hours || 0) * 3600000
    for (let j = i + 1; j < sorted.length; j++) {
      const startJ = new Date(sorted[j].scheduled_date).getTime()
      if (startJ < endI) {
        conflicts.add(sorted[i].id)
        conflicts.add(sorted[j].id)
      }
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const osId = e.dataTransfer.getData('os_id')
    if (osId) onDropOS(osId, tech.id, date)
  }

  const totalDuration = sorted.reduce((sum, os) => sum + (os.predicted_duration_hours || 0), 0)
  const totalDisplacement = sorted.reduce((sum, os) => sum + (os.displacement_min || 0) / 60, 0)
  const totalOccupied = totalDuration + totalDisplacement
  const capacity = tech.capacity_diaria_hours || 8
  const occPct = capacity > 0 ? (totalOccupied / capacity) * 100 : 0
  const travelPct = capacity > 0 ? (totalDisplacement / capacity) * 100 : 0

  const overCapacity = occPct > 85
  const overTravel = travelPct > 25

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={cn(
        'min-h-[140px] h-full p-2 border-r border-b border-slate-200 bg-slate-50/50',
        'transition-colors hover:bg-slate-100',
      )}
    >
      {tech.id && (
        <div className="flex flex-col gap-1.5 mb-3 bg-white p-1.5 rounded border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold">
            <span>
              {totalOccupied.toFixed(1)}h / {capacity}h
            </span>
            <div className="flex gap-1.5">
              {overCapacity && (
                <AlertTriangle className="w-3.5 h-3.5 text-red-500" title="Alta Ocupação" />
              )}
              {overTravel && (
                <MapPin className="w-3.5 h-3.5 text-orange-500" title="Muito Deslocamento" />
              )}
            </div>
          </div>
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                overCapacity ? 'bg-red-500' : 'bg-blue-500',
              )}
              style={{ width: `${Math.min(occPct, 100)}%` }}
            />
          </div>
        </div>
      )}
      <div className="space-y-2">
        {sorted.map((os) => (
          <OSCard key={os.id} os={os} conflict={conflicts.has(os.id)} />
        ))}
      </div>
    </div>
  )
}
