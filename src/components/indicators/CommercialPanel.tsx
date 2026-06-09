import { KPI } from './KPI'
import { Target, TrendingUp, DollarSign } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import {
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts'

export function CommercialPanel({ metrics, orders }: any) {
  const freqMap: Record<string, number> = {}
  orders.forEach((o: any) => {
    freqMap[o.service_type] = (freqMap[o.service_type] || 0) + 1
  })
  const paretoData = Object.entries(freqMap)
    .sort((a, b) => b[1] - a[1])
    .map(([type, freq]) => ({ type, freq }))

  let cumSum = 0
  const total = paretoData.reduce((acc, curr) => acc + curr.freq, 0)
  paretoData.forEach((item) => {
    cumSum += item.freq
    ;(item as any).cumPercentage = (cumSum / total) * 100
  })

  const ticketMap: Record<string, { sum: number; count: number }> = {}
  orders.forEach((o: any) => {
    if (o.final_value) {
      if (!ticketMap[o.service_type]) ticketMap[o.service_type] = { sum: 0, count: 0 }
      ticketMap[o.service_type].sum += o.final_value
      ticketMap[o.service_type].count++
    }
  })
  const ticketData = Object.entries(ticketMap).map(([type, vals]) => ({
    type,
    avg: vals.sum / vals.count,
  }))

  const fmtCurrency = (n: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPI
          title="Taxa de Conversão"
          value={`${(metrics.conversionRate * 100).toFixed(1)}%`}
          icon={<Target />}
        />
        <KPI
          title="Ticket Médio Global"
          value={fmtCurrency(
            orders.reduce((acc: number, o: any) => acc + (o.final_value || 0), 0) /
              (orders.length || 1),
          )}
          icon={<DollarSign />}
        />
        <KPI
          title="Líder de Receita"
          value={
            Object.entries(
              orders.reduce((acc: any, o: any) => {
                acc[o.customer_name] = (acc[o.customer_name] || 0) + (o.final_value || 0)
                return acc
              }, {}),
            ).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || 'N/A'
          }
          icon={<TrendingUp />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Curva de Pareto (Tipos de Serviço)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ChartContainer
                config={{
                  freq: { label: 'Frequência', color: 'hsl(var(--primary))' },
                  cumPercentage: { label: '% Acumulada', color: 'hsl(var(--destructive))' },
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={paretoData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="type"
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      interval={0}
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar
                      yAxisId="left"
                      dataKey="freq"
                      fill="var(--color-freq)"
                      radius={[4, 4, 0, 0]}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="cumPercentage"
                      stroke="var(--color-cumPercentage)"
                      strokeWidth={2}
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Ticket Médio por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ChartContainer
                config={{ avg: { label: 'Ticket Médio (R$)', color: 'hsl(var(--primary))' } }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ticketData} layout="vertical" margin={{ left: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" />
                    <YAxis dataKey="type" type="category" width={100} tick={{ fontSize: 11 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="avg" fill="var(--color-avg)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
