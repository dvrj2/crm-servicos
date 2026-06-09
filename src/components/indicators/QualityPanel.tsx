import { KPI } from './KPI'
import { Heart, MessageSquareWarning, FileWarning } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ComposedChart,
  Line,
  Legend,
} from 'recharts'

export function QualityPanel({ metrics, orders }: any) {
  const incompleteReports = orders.filter(
    (o: any) => o.status === 'concluído' && (!o.signature || o.has_pending_checklist),
  )
  const incompleteRate = orders.length ? incompleteReports.length / orders.length : 0

  const { radarData, topTechs, paretoData } = metrics

  const colors = ['hsl(var(--primary))', '#10b981', '#f59e0b']
  const radarConfig: any = {}
  topTechs.forEach((tech: any, idx: number) => {
    radarConfig[`Tech${idx + 1}`] = { label: tech.name, color: colors[idx % colors.length] }
  })

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPI
          title="NPS (Net Promoter Score)"
          value={`${metrics.npsScore.toFixed(0)}`}
          icon={<Heart />}
        />
        <KPI
          title="Reclamações Formais"
          value={metrics.complaints.toString()}
          icon={<MessageSquareWarning />}
          alert={metrics.complaints > 5}
        />
        <KPI
          title="Relatórios Incompletos"
          value={`${(incompleteRate * 100).toFixed(1)}%`}
          icon={<FileWarning />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Radar de Técnicos (Top 3)</CardTitle>
          </CardHeader>
          <CardContent>
            {topTechs.length > 0 ? (
              <div className="h-[300px]">
                <ChartContainer config={radarConfig}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                      {topTechs.map((tech: any, idx: number) => (
                        <Radar
                          key={tech.id}
                          name={tech.name}
                          dataKey={`Tech${idx + 1}`}
                          stroke={`var(--color-Tech${idx + 1})`}
                          fill={`var(--color-Tech${idx + 1})`}
                          fillOpacity={0.3}
                        />
                      ))}
                    </RadarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">
                Dados insuficientes
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle>Pareto de Problemas Mais Comuns (Por Tipo)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ChartContainer
                config={{
                  count: { label: 'Ocorrências', color: 'hsl(var(--destructive))' },
                  cumulative: { label: '% Acumulado', color: 'hsl(var(--primary))' },
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={paretoData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar
                      yAxisId="left"
                      dataKey="count"
                      fill="var(--color-count)"
                      radius={[4, 4, 0, 0]}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="cumulative"
                      stroke="var(--color-cumulative)"
                      strokeWidth={2}
                      dot={{ r: 3 }}
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
