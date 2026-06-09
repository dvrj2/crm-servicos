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
} from 'recharts'

export function QualityPanel({ metrics, orders }: any) {
  const incompleteReports = orders.filter(
    (o: any) => o.status === 'concluido' && (!o.signature || o.has_pending_checklist),
  )
  const incompleteRate = orders.length ? incompleteReports.length / orders.length : 0

  const radarData = [
    { subject: 'Velocidade', A: Math.max(0, 100 - metrics.firstContactLatency * 2), fullMark: 100 },
    { subject: 'Qualidade', A: Math.max(0, metrics.npsScore), fullMark: 100 },
    { subject: 'Eficiência', A: Math.min(100, metrics.occupancy * 100), fullMark: 100 },
    { subject: 'Precisão', A: Math.max(0, 100 - metrics.reworkRate * 500), fullMark: 100 },
  ]

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Desempenho Multidimensional</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ChartContainer config={{ A: { label: 'Score', color: 'hsl(var(--primary))' } }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar
                      name="Score"
                      dataKey="A"
                      stroke="var(--color-A)"
                      fill="var(--color-A)"
                      fillOpacity={0.5}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </RadarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Retrabalho por Técnico</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ChartContainer
                config={{ reworks: { label: 'Retrabalhos', color: 'hsl(var(--destructive))' } }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.reworkByTech} layout="vertical" margin={{ left: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="reworks" fill="var(--color-reworks)" radius={[0, 4, 4, 0]} />
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
