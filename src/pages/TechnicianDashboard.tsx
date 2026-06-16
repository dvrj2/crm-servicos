import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { getTechnicianOS } from '@/services/technician'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format, isToday, parseISO, endOfDay, isAfter } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { MapPin, Clock, Calendar as CalendarIcon, CheckCircle2, ChevronRight } from 'lucide-react'
import { OSExecutionView } from '@/components/technician/OSExecutionView'

export default function TechnicianDashboard() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOs, setSelectedOs] = useState<any | null>(null)

  const loadData = async () => {
    if (!user?.id) return
    try {
      const data = await getTechnicianOS(user.id)
      setOrders(data)
    } catch (error) {
      console.error('Failed to load orders', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user])

  useRealtime('service_orders', (e) => {
    if (e.record.technician === user?.id) {
      loadData()
      if (selectedOs && selectedOs.id === e.record.id) {
        setSelectedOs({ ...selectedOs, ...e.record })
      }
    }
  })

  if (loading)
    return <div className="flex h-full items-center justify-center p-8">Carregando...</div>

  if (selectedOs) {
    return <OSExecutionView os={selectedOs} onBack={() => setSelectedOs(null)} />
  }

  const todayEnd = endOfDay(new Date())

  const dailyOrders = orders.filter((o) => {
    if (!o.scheduled_date) return false
    const d = parseISO(o.scheduled_date)
    return isToday(d) && o.status !== 'concluído'
  })

  const futureOrders = orders.filter((o) => {
    if (!o.scheduled_date) return false
    const d = parseISO(o.scheduled_date)
    return isAfter(d, todayEnd) && o.status !== 'concluído'
  })

  const historyOrders = orders.filter((o) => o.status === 'concluído')

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'baixa':
        return 'bg-blue-100 text-blue-800'
      case 'média':
        return 'bg-yellow-100 text-yellow-800'
      case 'crítica':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-slate-100 text-slate-800'
    }
  }

  const getStatusColor = (status: string) => {
    if (status === 'concluído') return 'bg-emerald-100 text-emerald-800'
    if (status === 'executando') return 'bg-blue-100 text-blue-800'
    return 'bg-slate-100 text-slate-800'
  }

  const renderOrderCard = (os: any) => (
    <Card
      key={os.id}
      className="mb-4 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => setSelectedOs(os)}
    >
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-semibold text-slate-900">
              {os.customer_name || os.expand?.customer?.name || 'Cliente não informado'}
            </h3>
            <p className="text-sm text-slate-500 font-medium">{os.service_type}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant="outline" className={getUrgencyColor(os.urgency)}>
              {os.urgency}
            </Badge>
            <Badge variant="outline" className={getStatusColor(os.status)}>
              {os.status}
            </Badge>
          </div>
        </div>

        <div className="grid gap-2 mt-4 text-sm text-slate-600">
          {os.scheduled_date && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>
                {format(parseISO(os.scheduled_date), "dd 'de' MMM, HH:mm", { locale: ptBR })}
              </span>
            </div>
          )}
          {os.expand?.customer?.address && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{os.expand.customer.address}</span>
            </div>
          )}
        </div>
      </div>
      <div className="bg-slate-50 p-3 flex justify-center border-t">
        <div className="flex items-center text-sm font-medium text-primary">
          Acessar Ordem de Serviço <ChevronRight className="w-4 h-4 ml-1" />
        </div>
      </div>
    </Card>
  )

  return (
    <div className="max-w-md mx-auto h-full flex flex-col bg-white md:border-x md:shadow-sm min-h-[calc(100vh-4rem)]">
      <div className="p-4 bg-primary text-primary-foreground">
        <h1 className="text-xl font-bold">Painel do Técnico</h1>
        <p className="text-primary-foreground/80 text-sm">Gerencie suas ordens de serviço</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50">
        <Tabs defaultValue="hoje" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="hoje">Hoje ({dailyOrders.length})</TabsTrigger>
            <TabsTrigger value="futuras">Futuras</TabsTrigger>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="hoje" className="mt-0">
            {dailyOrders.length === 0 ? (
              <div className="text-center py-12 text-slate-500 flex flex-col items-center">
                <CheckCircle2 className="w-12 h-12 mb-3 text-slate-300" />
                <p>Nenhuma ordem de serviço para hoje.</p>
              </div>
            ) : (
              dailyOrders.map(renderOrderCard)
            )}
          </TabsContent>

          <TabsContent value="futuras" className="mt-0">
            {futureOrders.length === 0 ? (
              <div className="text-center py-12 text-slate-500 flex flex-col items-center">
                <CalendarIcon className="w-12 h-12 mb-3 text-slate-300" />
                <p>Nenhuma ordem futura agendada.</p>
              </div>
            ) : (
              futureOrders.map(renderOrderCard)
            )}
          </TabsContent>

          <TabsContent value="historico" className="mt-0">
            {historyOrders.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <p>Nenhum histórico disponível.</p>
              </div>
            ) : (
              historyOrders.map(renderOrderCard)
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
