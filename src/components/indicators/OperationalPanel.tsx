import { KPI } from './KPI'
import { Activity, Clock, Wrench, BarChart2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
} from 'recharts'
import { format, parseISO } from 'date-fns'

export function OperationalPanel({ metrics, orders }: any) {
  const slaDataMap: Record<string, { total: number; met: number }> = {}
  orders.forEach((o: any) => {
    const d = format(parseISO(o.created), 'MMM dd')
    if (!slaDataMap[d]) slaDataMap[d] = { total: 0, met: 0 }
    slaDataMap[d].total++
    const completion = o.finished_at ? parseISO(o.finished_at) : new Date()
    if (o.sla_deadline && completion <= parseISO(o.sla_deadline)) slaDataMap[d].met++
  })
  const slaChartData = Object.entries(slaDataMap)
    .map(([date, vals]) => ({
      date,
      sla: (vals.met / vals.total) * 100,
    }))
    .slice(-14)

  const heatmapData = orders
    .filter((o: any) => o.lat && o.lng)
    .map((o: any) => ({
      x: o.lng,
      y: o.lat,
      z: 1,
      name: o.region || 'Desconhecida',
    }))

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI
          title="SLA Cumprido"
          value={`${(metrics.slaFulfillment * 100).toFixed(1)}%`}
          icon={<Activity />}
          alert={metrics.slaFulfillment < 0.8}
        />
        <KPI
          title="Latência de Contato"
          value={`${metrics.firstContactLatency.toFixed(1)}h`}
          icon={<Clock />}
        />
        <KPI
          title="Taxa de Retrabalho"
          value={`${(metrics.reworkRate * 100).toFixed(1)}%`}
          icon={<Wrench />}
          alert={metrics.reworkRate > 0.08}
        />
        <KPI
          title="Ocupação (Capacidade)"
          value={`${(metrics.occupancy * 100).toFixed(1)}%`}
          icon={<BarChart2 />}
          alert={metrics.occupancy > 0.95}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Cumprimento de SLA ao Longo do Tempo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ChartContainer config={{ sla: { label: 'SLA %', color: 'hsl(var(--primary))' } }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={slaChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 100]} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="sla"
                      stroke="var(--color-sla)"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Densidade de Chamados Geográfica</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ChartContainer
                config={{ z: { label: 'Ocorrências', color: 'hsl(var(--primary))' } }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid />
                    <XAxis
                      type="number"
                      dataKey="x"
                      name="Longitude"
                      domain={['auto', 'auto']}
                      hide
                    />
                    <YAxis
                      type="number"
                      dataKey="y"
                      name="Latitude"
                      domain={['auto', 'auto']}
                      hide
                    />
                    <ZAxis type="number" dataKey="z" range={[50, 400]} />
                    <ChartTooltip
                      cursor={{ strokeDasharray: '3 3' }}
                      content={({ payload }) => {
                        if (payload && payload.length) {
                          return (
                            <div className="bg-white p-2 border shadow-sm rounded text-sm">
                              {payload[0].payload.name}
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Scatter
                      name="Chamados"
                      data={heatmapData}
                      fill="var(--color-z)"
                      opacity={0.6}
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
