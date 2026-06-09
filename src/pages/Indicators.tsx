import { useState, useEffect } from 'react'
import { getServiceOrders, getTechnicians, getServiceFeedbacks, getAllPhotos } from '@/services/api'
import { ServiceOrder, User, ServiceFeedback, ServiceOrderPhoto } from '@/types'
import { useDashboardMetrics } from '@/hooks/use-dashboard-metrics'
import { FiltersBar } from '@/components/indicators/FiltersBar'
import { OperationalPanel } from '@/components/indicators/OperationalPanel'
import { CommercialPanel } from '@/components/indicators/CommercialPanel'
import { FinancialPanel } from '@/components/indicators/FinancialPanel'
import { QualityPanel } from '@/components/indicators/QualityPanel'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertTriangle } from 'lucide-react'

export default function IndicatorsPage() {
  const [orders, setOrders] = useState<ServiceOrder[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [feedbacks, setFeedbacks] = useState<ServiceFeedback[]>([])
  const [photos, setPhotos] = useState<ServiceOrderPhoto[]>([])
  const [loading, setLoading] = useState(true)

  const [filters, setFilters] = useState({
    period: '30',
    technician: '',
    region: '',
    category: '',
    urgency: '',
    customer: '',
  })

  useEffect(() => {
    Promise.all([getServiceOrders(), getTechnicians(), getServiceFeedbacks(), getAllPhotos()])
      .then(([o, u, f, p]) => {
        setOrders(o)
        setUsers(u)
        setFeedbacks(f)
        setPhotos(p)
        setLoading(false)
      })
      .catch(console.error)
  }, [])

  const metrics = useDashboardMetrics(orders, users, feedbacks, photos, filters)

  if (loading)
    return (
      <div className="p-8 text-center text-muted-foreground animate-pulse">
        Carregando indicadores...
      </div>
    )

  const alerts = []
  if (metrics.slaFulfillment < 0.8) alerts.push('SLA Global está abaixo de 80%.')
  if (metrics.reworkRate > 0.08) alerts.push('Taxa de Retrabalho Global excede 8%.')
  if (metrics.occupancy > 0.95)
    alerts.push('Ocupação de Técnicos acima de 95%. Risco de gargalo operacional.')
  if (metrics.negativeMarginRate > 0.05)
    alerts.push('Ordens com margem negativa excedem 5% do total aprovado.')

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            Painel de Indicadores Estratégicos
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

      <Tabs defaultValue="operacional" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="operacional">Operacional (TOC)</TabsTrigger>
          <TabsTrigger value="comercial">Comercial</TabsTrigger>
          <TabsTrigger value="financeiro">Financeiro (BSC)</TabsTrigger>
          <TabsTrigger value="qualidade">Qualidade & Satisfação</TabsTrigger>
        </TabsList>
        <TabsContent value="operacional" className="mt-0">
          <OperationalPanel metrics={metrics} orders={metrics.orders} users={users} />
        </TabsContent>
        <TabsContent value="comercial" className="mt-0">
          <CommercialPanel metrics={metrics} orders={metrics.orders} />
        </TabsContent>
        <TabsContent value="financeiro" className="mt-0">
          <FinancialPanel metrics={metrics} orders={metrics.orders} />
        </TabsContent>
        <TabsContent value="qualidade" className="mt-0">
          <QualityPanel metrics={metrics} orders={metrics.orders} users={users} photos={photos} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
