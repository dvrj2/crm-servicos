import React from 'react'
import { ServiceOrder } from '@/types'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Clock, MapPin, AlertCircle } from 'lucide-react'

export function OSCard({ os, conflict }: { os: ServiceOrder; conflict?: boolean }) {
  const urgencyColor = {
    baixa: 'bg-green-100 text-green-800 border-green-200',
    media: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    alta: 'bg-red-100 text-red-800 border-red-200',
  }

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('os_id', os.id)
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className={cn(
        'p-2.5 mb-2 rounded-md border text-sm shadow-sm cursor-grab active:cursor-grabbing bg-white relative transition-all',
        conflict
          ? 'border-red-500 shadow-[0_0_0_1px_#ef4444]'
          : 'border-slate-200 hover:border-slate-300 hover:shadow-md',
      )}
    >
      {conflict && (
        <AlertCircle
          className="w-4 h-4 text-red-500 absolute -top-1.5 -right-1.5 bg-white rounded-full"
          title="Conflito de Horário"
        />
      )}
      <div
        className="font-semibold text-xs mb-1.5 truncate text-slate-800"
        title={os.customer_name}
      >
        {os.customer_name}
      </div>
      <div className="flex justify-between items-start mb-2">
        <Badge
          variant="outline"
          className={cn('text-[10px] px-1.5 py-0 font-medium', urgencyColor[os.urgency])}
        >
          {os.urgency}
        </Badge>
        <span className="text-[10px] text-slate-500 truncate max-w-[80px]" title={os.service_type}>
          {os.service_type}
        </span>
      </div>
      <div className="flex items-center gap-3 text-[10px] text-slate-500 font-medium bg-slate-50 rounded py-1 px-1.5">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-blue-500" />
          {os.predicted_duration_hours}h
        </span>
        <span className="flex items-center gap-1">
          <MapPin className="w-3 h-3 text-orange-500" />
          {os.estimated_travel_hours?.toFixed(1)}h
        </span>
      </div>
    </div>
  )
}
