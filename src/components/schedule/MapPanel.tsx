import { useMemo, useState } from 'react'
import { ServiceOrder, User } from '@/types'
import { isSameDay, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { User as UserIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Props {
  techs: User[]
  orders: ServiceOrder[]
  selectedTechId: string
  weekDates: Date[]
}

export function MapPanel({ techs, orders, selectedTechId, weekDates }: Props) {
  const [mapDateIndex, setMapDateIndex] = useState('0')
  const mapDate = weekDates[parseInt(mapDateIndex)]

  const minLat = -23.8
  const maxLat = -23.2
  const minLng = -46.9
  const maxLng = -46.3

  const getPosition = (lat: number, lng: number) => {
    const x = ((lng - minLng) / (maxLng - minLng)) * 100
    const y = ((maxLat - lat) / (maxLat - minLat)) * 100
    return { left: `${Math.max(0, Math.min(100, x))}%`, top: `${Math.max(0, Math.min(100, y))}%` }
  }

  const mapOrders = useMemo(() => {
    return orders
      .filter((o) => {
        if (!isSameDay(new Date(o.scheduled_date), mapDate)) return false
        if (selectedTechId !== '_all' && o.technician !== selectedTechId) return false
        if (!o.lat || !o.lng) return false
        return true
      })
      .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime())
  }, [orders, mapDate, selectedTechId])

  const mapTechs = useMemo(() => {
    return techs.filter((t) => {
      if (selectedTechId !== '_all' && t.id !== selectedTechId) return false
      if (!t.current_lat || !t.current_lng) return false
      return true
    })
  }, [techs, selectedTechId])

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-slate-200 shadow-sm">
      <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-lg">
        <h3 className="font-semibold text-sm text-slate-700">Mapa de Operações</h3>
        <Select value={mapDateIndex} onValueChange={setMapDateIndex}>
          <SelectTrigger className="w-[180px] h-8 text-xs bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {weekDates.map((d, i) => (
              <SelectItem key={i} value={i.toString()}>
                {format(d, 'EEEE, dd/MM', { locale: ptBR })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="relative flex-1 bg-slate-100 overflow-hidden rounded-b-lg">
        <img
          src="https://img.usecurling.com/p/800/800?q=street%20map&color=gray"
          alt="Map Background"
          className="absolute inset-0 w-full h-full object-cover opacity-60 pointer-events-none"
        />

        {selectedTechId !== '_all' && mapTechs.length === 1 && mapOrders.length > 0 && (
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <polyline
              points={
                `${((mapTechs[0].current_lng! - minLng) / (maxLng - minLng)) * 100},${((maxLat - mapTechs[0].current_lat!) / (maxLat - minLat)) * 100} ` +
                mapOrders
                  .map(
                    (o) =>
                      `${((o.lng! - minLng) / (maxLng - minLng)) * 100},${((maxLat - o.lat!) / (maxLat - minLat)) * 100}`,
                  )
                  .join(' ')
              }
              fill="none"
              stroke="#2563eb"
              strokeWidth="0.4"
              strokeDasharray="1 1"
            />
          </svg>
        )}

        {mapOrders.map((o, idx) => (
          <div
            key={o.id}
            className="absolute transform -translate-x-1/2 -translate-y-full cursor-help group transition-transform hover:scale-110"
            style={getPosition(o.lat!, o.lng!)}
          >
            <div
              className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-white shadow-md border-2 border-white',
                o.urgency === 'alta'
                  ? 'bg-red-500'
                  : o.urgency === 'media'
                    ? 'bg-yellow-500'
                    : 'bg-green-500',
              )}
            >
              <span className="text-[10px] font-bold">{idx + 1}</span>
            </div>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block w-36 p-2 bg-slate-900 text-white rounded shadow-xl border border-slate-700 text-xs z-30">
              <div className="font-semibold truncate text-slate-100">{o.customer_name}</div>
              <div className="text-slate-400 mt-0.5">{o.service_type}</div>
            </div>
          </div>
        ))}

        {mapTechs.map((t) => (
          <div
            key={t.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-help group transition-transform hover:scale-110"
            style={getPosition(t.current_lat!, t.current_lng!)}
          >
            <div className="w-8 h-8 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center shadow-lg">
              <UserIcon className="w-4 h-4 text-white" />
            </div>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block w-max px-2.5 py-1 bg-slate-900 text-white rounded shadow-xl border border-slate-700 text-xs z-40 font-medium">
              {t.name} (Atual)
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
