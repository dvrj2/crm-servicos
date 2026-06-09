import { useEffect, useState, useMemo } from 'react'
import { startOfWeek, addDays, isSameDay } from 'date-fns'
import { getServiceOrders, getTechnicians, updateOrder } from '@/services/api'
import { ServiceOrder, User } from '@/types'
import { useRealtime } from '@/hooks/use-realtime'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'
import { toast } from '@/components/ui/use-toast'
import { ScheduleFilters } from '@/components/schedule/ScheduleFilters'
import { TimelineGrid } from '@/components/schedule/TimelineGrid'
import { MapPanel } from '@/components/schedule/MapPanel'

export default function Schedule() {
  const [orders, setOrders] = useState<ServiceOrder[]>([])
  const [techs, setTechs] = useState<User[]>([])
  const [weekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))
  const weekDates = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i))

  const [selectedTechId, setSelectedTechId] = useState<string>('_all')
  const [minCapacity, setMinCapacity] = useState<number>(0)
  const [regionFilter, setRegionFilter] = useState<string>('_all')
  const [urgencyFilter, setUrgencyFilter] = useState<string>('_all')
  const [serviceTypeFilter, setServiceTypeFilter] = useState<string>('_all')

  const loadData = async () => {
    try {
      const [os, ts] = await Promise.all([getServiceOrders(), getTechnicians()])
      setOrders(os)
      setTechs(ts)
    } catch (err) {
      toast({ variant: 'destructive', title: 'Erro ao carregar dados' })
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('service_orders', loadData)

  const filteredTechs = useMemo(() => {
    return techs.filter((t) => {
      if (selectedTechId !== '_all' && t.id !== selectedTechId) return false
      if (minCapacity > 0) {
        const hasCapacity = weekDates.some((date) => {
          const dayOrders = orders.filter(
            (o) => o.technician === t.id && isSameDay(new Date(o.scheduled_date), date),
          )
          const used = dayOrders.reduce((sum, o) => sum + (o.predicted_duration_hours || 0), 0)
          return (t.capacity_diaria_hours || 8) - used >= minCapacity
        })
        if (!hasCapacity) return false
      }
      return true
    })
  }, [techs, selectedTechId, minCapacity, orders, weekDates])

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (regionFilter !== '_all' && o.region !== regionFilter) return false
      if (urgencyFilter !== '_all' && o.urgency !== urgencyFilter) return false
      if (serviceTypeFilter !== '_all' && o.service_type !== serviceTypeFilter) return false
      return true
    })
  }, [orders, regionFilter, urgencyFilter, serviceTypeFilter])

  const handleDropOS = async (osId: string, techId: string, date: Date) => {
    const os = orders.find((o) => o.id === osId)
    if (!os) return

    const isSame = os.technician === techId && isSameDay(new Date(os.scheduled_date), date)
    if (isSame) return

    const dayOrders = orders.filter(
      (o) =>
        o.technician === techId && isSameDay(new Date(o.scheduled_date), date) && o.id !== osId,
    )
    const totalDuration = dayOrders.reduce(
      (acc, curr) => acc + (curr.predicted_duration_hours || 0),
      0,
    )

    let capacity = 24
    if (techId !== '') {
      const tech = techs.find((t) => t.id === techId)
      capacity = tech?.capacity_diaria_hours || 8
    }

    if (totalDuration + (os.predicted_duration_hours || 0) > capacity) {
      toast({
        variant: 'destructive',
        title: 'Capacidade Excedida',
        description: 'O técnico não possui horas suficientes para este serviço.',
      })
      return
    }

    const origDate = new Date(os.scheduled_date || new Date())
    const newDate = new Date(date)
    newDate.setHours(origDate.getHours(), origDate.getMinutes(), 0, 0)

    try {
      const nextDateStr = newDate.toISOString().replace('T', ' ').substring(0, 19) + 'Z'
      setOrders((prev) =>
        prev.map((o) =>
          o.id === osId ? { ...o, technician: techId, scheduled_date: nextDateStr } : o,
        ),
      )
      await updateOrder(os.id, { technician: techId, scheduled_date: nextDateStr })
      toast({ title: 'Atribuição atualizada com sucesso' })
    } catch (err) {
      loadData()
      toast({ variant: 'destructive', title: 'Erro ao mover a OS' })
    }
  }

  return (
    <div className="flex flex-col h-full gap-4 pb-4">
      <ScheduleFilters
        techs={techs}
        selectedTechId={selectedTechId}
        setSelectedTechId={setSelectedTechId}
        minCapacity={minCapacity}
        setMinCapacity={setMinCapacity}
        regionFilter={regionFilter}
        setRegionFilter={setRegionFilter}
        urgencyFilter={urgencyFilter}
        setUrgencyFilter={setUrgencyFilter}
        serviceTypeFilter={serviceTypeFilter}
        setServiceTypeFilter={setServiceTypeFilter}
      />

      <div className="flex-1 min-h-[500px]">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={70} className="mr-2">
            <TimelineGrid
              techs={filteredTechs}
              weekDates={weekDates}
              orders={filteredOrders}
              onDropOS={handleDropOS}
            />
          </ResizablePanel>
          <ResizableHandle withHandle className="bg-slate-200 hover:bg-primary transition-colors" />
          <ResizablePanel defaultSize={30} className="ml-2">
            <MapPanel
              techs={techs}
              orders={filteredOrders}
              selectedTechId={selectedTechId}
              weekDates={weekDates}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  )
}
