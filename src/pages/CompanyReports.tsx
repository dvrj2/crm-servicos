import { useEffect, useState } from 'react'
import { getServiceOrders } from '@/services/api'
import { getFinancials } from '@/services/financials'
import { ServiceOrder, Financial } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Target, TrendingUp, AlertTriangle } from 'lucide-react'

export default function CompanyReports() {
  const [os, setOs] = useState<ServiceOrder[]>([])
  const [financials, setFinancials] = useState<Financial[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getServiceOrders(), getFinancials()]).then(([o, f]) => {
      setOs(o)
      setFinancials(f)
      setLoading(false)
    })
  }, [])

  const completedOS = os.filter((o) => o.status === 'concluído')
  const onTimeOS = completedOS.filter(
    (o) => o.finished_at && o.sla_deadline && new Date(o.finished_at) <= new Date(o.sla_deadline),
  )
  const slaCompliance = completedOS.length ? (onTimeOS.length / completedOS.length) * 100 : 0

  const marginSum = financials.reduce((acc, f) => acc + (f.actual_margin || 0), 0)
  const avgMargin = financials.length ? marginSum / financials.length : 0

  const reworkOS = os.filter((o) => o.is_rework)
  const reworkRate = os.length ? (reworkOS.length / os.length) * 100 : 0

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Relatórios de Performance</h1>
        <p className="text-muted-foreground">Métricas operacionais e de SLA da empresa.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cumprimento de SLA</CardTitle>
            <Target className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{slaCompliance.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {onTimeOS.length} de {completedOS.length} OS no prazo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margem Média</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{avgMargin.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">Margem real sobre OS</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Índice de Retrabalho</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{reworkRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {reworkOS.length} OS com retrabalho
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
