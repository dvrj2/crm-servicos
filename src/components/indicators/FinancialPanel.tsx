import { KPI } from './KPI'
import { AlertCircle, Wallet, CreditCard } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from 'recharts'
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
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
            <CardTitle>Análise de Margem Global</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ChartContainer config={{ value: { label: 'Valor', color: 'hsl(var(--primary))' } }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={marginData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {marginData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            index === 0
                              ? 'hsl(var(--muted-foreground))'
                              : entry.value < marginData[0].value
                                ? 'hsl(var(--destructive))'
                                : 'hsl(var(--primary))'
                          }
                        />
                      ))}
                    </Bar>
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
