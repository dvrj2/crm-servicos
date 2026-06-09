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
    if (o.status === 'concluído' && o.sla_deadline) {
      const d = format(parseISO(o.created), 'MMM dd')
      if (!slaDataMap[d]) slaDataMap[d] = { total: 0, met: 0 }
      slaDataMap[d].total++
      const completion = o.finished_at ? parseISO(o.finished_at) : parseISO(o.updated)
      if (completion <= parseISO(o.sla_deadline)) slaDataMap[d].met++
    }
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
      name: o.region || o.customer_name || 'Desconhecida',
    }))

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Evolução de Cumprimento de SLA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
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
                      strokeWidth={3}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Mapa de Calor Geográfico por Serviço</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] relative rounded-md overflow-hidden bg-slate-100 border">
              <img
                src="https://img.usecurling.com/p/800/400?q=map&color=gray"
                alt="Map Background"
                className="absolute inset-0 w-full h-full object-cover opacity-60 pointer-events-none"
              />
              <div className="absolute inset-0">
                <ChartContainer
                  config={{ z: { label: 'Ocorrências', color: 'hsl(var(--destructive))' } }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <XAxis type="number" dataKey="x" domain={['auto', 'auto']} hide />
                      <YAxis type="number" dataKey="y" domain={['auto', 'auto']} hide />
                      <ZAxis type="number" dataKey="z" range={[50, 400]} />
                      <ChartTooltip
                        cursor={{ strokeDasharray: '3 3' }}
                        content={({ payload }) => {
                          if (payload && payload.length) {
                            return (
                              <div className="bg-white p-2 border shadow-sm rounded text-sm font-medium z-50">
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
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
