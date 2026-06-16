import { useEffect, useState, useMemo } from 'react'
import { getFinancials } from '@/services/financials'
import { Financial } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useRealtime } from '@/hooks/use-realtime'
import { DollarSign, Percent, AlertCircle } from 'lucide-react'

export default function Finance() {
  const [financials, setFinancials] = useState<Financial[]>([])

  const loadData = async () => {
    try {
      const data = await getFinancials()
      setFinancials(data)
    } catch (e) {
      console.error('Failed to load financials', e)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('financials', loadData)

  const stats = useMemo(() => {
    let totalRevenue = 0
    let marginSum = 0
    let marginCount = 0
    let pendingCount = 0

    financials.forEach((f) => {
      totalRevenue += f.final_value || 0
      if (f.actual_margin !== undefined && f.actual_margin !== null) {
        marginSum += f.actual_margin
        marginCount++
      }
      if (f.payment_status === 'pendente') {
        pendingCount++
      }
    })

    return {
      revenue: totalRevenue,
      avgMargin: marginCount > 0 ? marginSum / marginCount : 0,
      pending: pendingCount,
    }
  }, [financials])

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard Financeiro</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="w-4 h-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                stats.revenue,
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Margem Média</CardTitle>
            <Percent className="w-4 h-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgMargin.toFixed(1)}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pendências</CardTitle>
            <AlertCircle className="w-4 h-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white rounded-lg border shadow-sm mt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID Execução</TableHead>
              <TableHead>Valor Final</TableHead>
              <TableHead>Margem</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {financials.map((f) => (
              <TableRow key={f.id}>
                <TableCell className="font-medium">{f.execution}</TableCell>
                <TableCell>
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                    f.final_value || 0,
                  )}
                </TableCell>
                <TableCell>{f.actual_margin ?? 0}%</TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${f.payment_status === 'pago' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}
                  >
                    {f.payment_status}
                  </span>
                </TableCell>
                <TableCell>{new Date(f.created).toLocaleDateString('pt-BR')}</TableCell>
              </TableRow>
            ))}
            {financials.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Nenhum registro financeiro encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
