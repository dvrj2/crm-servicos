import { useEffect, useState, useMemo } from 'react'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Skeleton } from '@/components/ui/skeleton'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { FileBarChart, CheckCircle2, Clock, AlertTriangle } from 'lucide-react'

export default function Reports() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const loadData = async () => {
      try {
        const records = await pb.collection('service_orders').getFullList()
        setOrders(records)
      } catch (err) {
        toast({ title: 'Erro', description: 'Erro ao carregar relatórios', variant: 'destructive' })
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const statusCount = useMemo(() => {
    const counts = orders.reduce(
      (acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [orders])

  const urgencyCount = useMemo(() => {
    const counts = orders.reduce(
      (acc, order) => {
        acc[order.urgency] = (acc[order.urgency] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [orders])

  const chartConfig = {
    value: { label: 'Quantidade', color: 'hsl(var(--primary))' },
  }

  const COLORS = [
    '#0ea5e9',
    '#22c55e',
    '#eab308',
    '#f97316',
    '#ef4444',
    '#8b5cf6',
    '#a855f7',
    '#ec4899',
  ]

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    )
  }

  const completed = orders.filter((o) => o.status === 'concluido' || o.status === 'faturado').length
  const pending = orders.length - completed
  const highUrgency = orders.filter((o) => o.urgency === 'alta').length

  return (
    <div className="h-full flex flex-col space-y-6 overflow-auto pb-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <FileBarChart className="h-6 w-6 text-primary" />
          Relatórios Operacionais
        </h2>
        <p className="text-sm text-slate-500">
          Visão geral do desempenho e volume de ordens de serviço.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de OS</CardTitle>
            <FileBarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgência Alta</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{highUrgency}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Status das Ordens</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ChartContainer config={chartConfig} className="h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusCount} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]}>
                    {statusCount.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Urgência</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ChartContainer config={chartConfig} className="h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={urgencyCount}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {urgencyCount.map((entry, index) => {
                      let color = '#3b82f6'
                      if (entry.name === 'alta') color = '#ef4444'
                      if (entry.name === 'media') color = '#eab308'
                      if (entry.name === 'baixa') color = '#22c55e'
                      return <Cell key={`cell-${index}`} fill={color} />
                    })}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
