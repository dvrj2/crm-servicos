import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { ServiceOrder, User, ServiceFeedback, ServiceOrderPhoto, Financial } from '@/types'
import { useDashboardMetrics } from '@/hooks/use-dashboard-metrics'
import { FiltersBar } from '@/components/indicators/FiltersBar'
import { OperationalPanel } from '@/components/indicators/OperationalPanel'
import { CommercialPanel } from '@/components/indicators/CommercialPanel'
import { FinancialPanel } from '@/components/indicators/FinancialPanel'
import { QualityPanel } from '@/components/indicators/QualityPanel'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertTriangle, Loader2, Activity, BarChart2, Wrench, Wallet, PieChart } from 'lucide-react'
import { KPI } from '@/components/indicators/KPI'

export default function IndicatorsPage() {
  const [orders, setOrders] = useState<ServiceOrder[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [feedbacks, setFeedbacks] = useState<ServiceFeedback[]>([])
  const [photos, setPhotos] = useState<ServiceOrderPhoto[]>([])
  const [financials, setFinancials] = useState<Financial[]>([])
  const [loading, setLoading] = useState(true)

  const [filters, setFilters] = useState({
    period: '30',
    technician: '',
    serviceType: '',
  })

  useEffect(() => {
    Promise.all([
      pb.collection('service_orders').getFullList<ServiceOrder>(),
      pb.collection('users').getFullList<User>(),
      pb.collection('service_feedback').getFullList<ServiceFeedback>(),
      pb.collection('service_order_photos').getFullList<ServiceOrderPhoto>(),
      pb.collection('financials').getFullList<Financial>(),
    ])
      .then(([o, u, f, p, fin]) => {
        setOrders(o)
        setUsers(u)
        setFeedbacks(f)
        setPhotos(p)
        setFinancials(fin)
        setLoading(false)
      })
      .catch(console.error)
  }, [])

  const metrics = useDashboardMetrics(orders, users, feedbacks, photos, financials, filters)

  if (loading)
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center text-muted-foreground animate-pulse">
        <Loader2 className="mb-4 h-8 w-8 animate-spin" />
        <span>Carregando indicadores...</span>
      </div>
    )

  const alerts = []
  if (metrics.slaFulfillment < 0.8) alerts.push('SLA Global está abaixo de 80%.')
  if (metrics.reworkRate > 0.08) alerts.push('Taxa de Retrabalho Global excede 8%.')
  if (metrics.technicalCapacity > 0.95)
    alerts.push('Ocupação de Técnicos acima de 95%. Risco de gargalo operacional.')
  if (metrics.margemReal < 0.1) alerts.push('Margem Real média está abaixo de 10%.')

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            Indicadores Operacionais e Estratégicos
          </h2>
          <p className="text-muted-foreground mt-1">
            Visão consolidada de desempenho operacional, comercial e financeiro.
          </p>
        </div>
      </div>

      <FiltersBar filters={filters} setFilters={setFilters} users={users} orders={orders} />

      {alerts.length > 0 && (
        <Alert variant="destructive" className="bg-red-50 border-red-200">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Atenção Requerida</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              {alerts.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <KPI
          title="SLA Cumprido"
          value={`${(metrics.slaFulfillment * 100).toFixed(1)}%`}
          icon={<Activity />}
          alert={metrics.slaFulfillment < 0.8}
        />
        <KPI
          title="Capacidade Técnica"
          value={`${(metrics.technicalCapacity * 100).toFixed(1)}%`}
          icon={<BarChart2 />}
          alert={metrics.technicalCapacity > 0.95}
        />
        <KPI
          title="Retrabalho"
          value={`${(metrics.reworkRate * 100).toFixed(1)}%`}
          icon={<Wrench />}
          alert={metrics.reworkRate > 0.08}
        />
        <KPI
          title="Ticket Médio"
          value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
            metrics.ticketMedio,
          )}
          icon={<Wallet />}
        />
        <KPI
          title="Margem Real"
          value={`${metrics.margemReal.toFixed(1)}%`}
          icon={<PieChart />}
          alert={metrics.margemReal < 0.1}
        />
      </div>

      <Tabs defaultValue="operacional" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="operacional">Operacional</TabsTrigger>
          <TabsTrigger value="qualidade">Qualidade & Satisfação</TabsTrigger>
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          <TabsTrigger value="comercial">Comercial</TabsTrigger>
        </TabsList>
        <TabsContent value="operacional" className="mt-0">
          <OperationalPanel metrics={metrics} orders={metrics.orders} users={users} />
        </TabsContent>
        <TabsContent value="qualidade" className="mt-0">
          <QualityPanel metrics={metrics} orders={metrics.orders} users={users} photos={photos} />
        </TabsContent>
        <TabsContent value="financeiro" className="mt-0">
          <FinancialPanel metrics={metrics} orders={metrics.orders} />
        </TabsContent>
        <TabsContent value="comercial" className="mt-0">
          <CommercialPanel metrics={metrics} orders={metrics.orders} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
