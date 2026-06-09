import { KPI } from './KPI'
import { AlertCircle, Wallet, CreditCard } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
  ComposedChart,
} from 'recharts'
import { format, parseISO } from 'date-fns'

export function FinancialPanel({ metrics, orders }: any) {
  const revMap: Record<string, number> = {}
  orders.forEach((o: any) => {
    if (['concluido', 'faturado'].includes(o.status) && o.final_value) {
      const d = format(parseISO(o.updated), 'MMM dd')
      revMap[d] = (revMap[d] || 0) + o.final_value
    }
  })
  const revenueData = Object.entries(revMap)
    .map(([date, revenue]) => ({ date, revenue }))
    .slice(-14)

  const marginData = [
    { name: 'Planejada', value: metrics.totalPlannedMargin },
    { name: 'Realizada', value: metrics.totalActualMargin },
  ]

  const fmtCurrency = (n: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)
  const recurringCount = orders.filter((o: any) => o.is_recurring).length

  // Budget precision "Boxplot" surrogate (Range bar min-max)
  const precisionDataMap: Record<string, { planned: number[]; actual: number[] }> = {}
  orders.forEach((o: any) => {
    if (o.service_type && o.planned_margin && o.actual_margin) {
      const st = o.service_type
      if (!precisionDataMap[st]) precisionDataMap[st] = { planned: [], actual: [] }
      precisionDataMap[st].planned.push(o.planned_margin)
      precisionDataMap[st].actual.push(o.actual_margin)
    }
  })

  const boxplotData = Object.entries(precisionDataMap)
    .map(([category, vals]) => {
      const avgPlanned = vals.planned.reduce((a, b) => a + b, 0) / vals.planned.length
      const avgActual = vals.actual.reduce((a, b) => a + b, 0) / vals.actual.length
      return {
        category,
        range: [Math.min(...vals.actual), Math.max(...vals.actual)],
        avgPlanned,
        avgActual,
      }
    })
    .slice(0, 5)

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPI
          title="Inadimplência"
          value={`${(metrics.inadimplencia * 100).toFixed(1)}%`}
          icon={<AlertCircle />}
          alert={metrics.inadimplencia > 0.1}
        />
        <KPI
          title="Receita Total (Período)"
          value={fmtCurrency(
            metrics.totalActualMargin +
              orders.reduce((a: any, b: any) => a + (b.final_value || 0), 0) / 2,
          )}
          icon={<Wallet />}
        />
        <KPI title="Serviços Recorrentes" value={recurringCount.toString()} icon={<CreditCard />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle>Receita ao Longo do Tempo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ChartContainer
                config={{ revenue: { label: 'Receita', color: 'hsl(var(--primary))' } }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Precisão Orçamentária (Boxplot)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ChartContainer
                config={{
                  range: { label: 'Range', color: 'hsl(var(--muted))' },
                  avgActual: { label: 'Real', color: 'hsl(var(--primary))' },
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={boxplotData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" />
                    <YAxis dataKey="category" type="category" width={80} tick={{ fontSize: 10 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar
                      dataKey="range"
                      fill="var(--color-range)"
                      radius={4}
                      barSize={20}
                      opacity={0.3}
                    />
                    <Bar
                      dataKey="avgActual"
                      fill="var(--color-avgActual)"
                      radius={4}
                      barSize={10}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
