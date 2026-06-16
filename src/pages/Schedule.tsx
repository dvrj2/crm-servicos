import { useEffect, useState, useMemo } from 'react'
import { startOfWeek, addDays, isSameDay } from 'date-fns'
import pb from '@/lib/pocketbase/client'
import { getServiceOrders, getTechnicians, updateOrder } from '@/services/api'
import { ServiceOrder, User, Appointment, Quote } from '@/types'
import { useRealtime } from '@/hooks/use-realtime'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'
import { toast } from '@/components/ui/use-toast'
import { ScheduleFilters } from '@/components/schedule/ScheduleFilters'
import { TimelineGrid } from '@/components/schedule/TimelineGrid'
import { MapPanel } from '@/components/schedule/MapPanel'
import { useAuth } from '@/hooks/use-auth'

export default function Schedule() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<ServiceOrder[]>([])
  const [techs, setTechs] = useState<User[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [quotes, setQuotes] = useState<Quote[]>([])

  const [weekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))
  const weekDates = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i))

  const [selectedTechId, setSelectedTechId] = useState<string>(
    user?.tipo_role === 'tecnico' ? user.id : '_all',
  )
  const [minCapacity, setMinCapacity] = useState<number>(0)
  const [regionFilter, setRegionFilter] = useState<string>('_all')
  const [urgencyFilter, setUrgencyFilter] = useState<string>('_all')
  const [serviceTypeFilter, setServiceTypeFilter] = useState<string>('_all')

  const loadData = async () => {
    try {
      const [os, ts, apps, qs] = await Promise.all([
        getServiceOrders(),
        getTechnicians(),
        pb.collection('appointments').getFullList(),
        pb.collection('quotes').getFullList(),
      ])
      setOrders(os)
      setTechs(ts)
      setAppointments(apps as unknown as Appointment[])
      setQuotes(qs as unknown as Quote[])
    } catch (err) {
      toast({ variant: 'destructive', title: 'Erro ao carregar dados' })
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('service_orders', loadData)
  useRealtime('appointments', loadData)

  const uiOrders = useMemo(() => {
    return orders.map((o) => {
      const quote = quotes.find((q) => q.service_order === o.id)
      const appt = appointments.find((a) => a.quote === quote?.id)

      if (appt) {
        return {
          ...o,
          _apptId: appt.id,
          _quoteId: quote?.id,
          scheduled_date: appt.start_time,
          technician: appt.technician,
        }
      }
      return {
        ...o,
        _quoteId: quote?.id,
      }
    })
  }, [orders, quotes, appointments])

  const filteredTechs = useMemo(() => {
    return techs.filter((t) => {
      if (selectedTechId !== '_all' && t.id !== selectedTechId) return false
      if (minCapacity > 0) {
        const hasCapacity = weekDates.some((date) => {
          const dayOrders = uiOrders.filter(
            (o) => o.technician === t.id && isSameDay(new Date(o.scheduled_date), date),
          )
          const used = dayOrders.reduce(
            (sum, o) => sum + (o.predicted_duration_hours || 0) + (o.displacement_min || 0) / 60,
            0,
          )
          return (t.capacity_diaria_hours || 8) - used >= minCapacity
        })
        if (!hasCapacity) return false
      }
      return true
    })
  }, [techs, selectedTechId, minCapacity, uiOrders, weekDates])

  const filteredOrders = useMemo(() => {
    return uiOrders.filter((o) => {
      if (regionFilter !== '_all' && o.region !== regionFilter) return false
      if (urgencyFilter !== '_all' && o.urgency !== urgencyFilter) return false
      if (serviceTypeFilter !== '_all' && o.service_type !== serviceTypeFilter) return false
      return true
    })
  }, [uiOrders, regionFilter, urgencyFilter, serviceTypeFilter])

  const handleDropOS = async (osId: string, techId: string, date: Date) => {
    const os = uiOrders.find((o) => o.id === osId)
    if (!os) return

    const isSame = os.technician === techId && isSameDay(new Date(os.scheduled_date), date)
    if (isSame) return

    const dayOrders = uiOrders.filter(
      (o) =>
        o.technician === techId && isSameDay(new Date(o.scheduled_date), date) && o.id !== osId,
    )
    const totalDuration = dayOrders.reduce(
      (acc, curr) => acc + (curr.predicted_duration_hours || 0) + (curr.displacement_min || 0) / 60,
      0,
    )

    let capacity = 24
    if (techId !== '') {
      const tech = techs.find((t) => t.id === techId)
      capacity = tech?.capacity_diaria_hours || 8
    }

    const osDuration = (os.predicted_duration_hours || 0) + (os.displacement_min || 0) / 60
    const newTotal = totalDuration + osDuration

    if (newTotal > capacity) {
      toast({
        variant: 'destructive',
        title: 'Capacidade Excedida',
        description: `O técnico não possui horas suficientes para este serviço. Necessário: ${newTotal.toFixed(1)}h, Disponível: ${capacity}h`,
      })
      return
    }

    if (newTotal / capacity > 0.85) {
      toast({
        variant: 'default',
        title: 'Aviso de Sobrecarga',
        description: 'O técnico ficará com mais de 85% da capacidade ocupada neste dia.',
      })
    }

    const origDate = new Date(os.scheduled_date || new Date())
    const newDate = new Date(date)
    newDate.setHours(origDate.getHours(), origDate.getMinutes(), 0, 0)
    const nextDateStr = newDate.toISOString().replace('T', ' ').substring(0, 19) + 'Z'

    try {
      if (os._apptId) {
        await pb.collection('appointments').update(os._apptId, {
          technician: techId,
          start_time: nextDateStr,
        })
      } else {
        let quoteId = os._quoteId
        if (!quoteId) {
          const q = await pb.collection('quotes').create({
            service_order: os.id,
            estimated_hours: os.predicted_duration_hours,
          })
          quoteId = q.id
        }
        await pb.collection('appointments').create({
          quote: quoteId,
          technician: techId,
          start_time: nextDateStr,
          predicted_duration: os.predicted_duration_hours,
          travel_time_min: os.displacement_min,
        })
      }

      await updateOrder(os.id, { technician: techId, scheduled_date: nextDateStr })
      toast({ title: 'Atribuição atualizada com sucesso' })
      loadData()
    } catch (err) {
      loadData()
      toast({ variant: 'destructive', title: 'Erro ao mover a OS' })
    }
  }

  return (
    <div className="flex flex-col h-full gap-4 pb-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">
          {user?.tipo_role === 'tecnico' ? 'Minha Agenda' : 'Agenda dos Técnicos'}
        </h1>
      </div>

      {user?.tipo_role !== 'tecnico' && (
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
      )}

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
