import { useEffect, useState } from 'react'
import { getFinancials } from '@/services/financials'
import { Financial } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, Activity, AlertCircle } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default function Finance() {
  const [financials, setFinancials] = useState<Financial[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getFinancials().then((data) => {
      setFinancials(data)
      setLoading(false)
    })
  }, [])

  const totalFaturamento = financials
    .filter((f) => f.payment_status === 'pago')
    .reduce((acc, f) => acc + (f.final_value || 0), 0)
  const margemMedia =
    financials.reduce((acc, f) => acc + (f.actual_margin || 0), 0) / (financials.length || 1)
  const pagamentosPendentes = financials
    .filter((f) => f.payment_status === 'pendente')
    .reduce((acc, f) => acc + (f.final_value || 0), 0)

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
        <p className="text-muted-foreground">Visão consolidada das suas operações.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {totalFaturamento.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margem Média</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{margemMedia.toFixed(1)}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagamentos Pendentes</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              R$ {pagamentosPendentes.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transações Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Margem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {financials.map((f) => (
                <TableRow key={f.id}>
                  <TableCell className="font-mono text-xs">{f.id}</TableCell>
                  <TableCell className="capitalize">{f.payment_status}</TableCell>
                  <TableCell>R$ {f.final_value?.toFixed(2)}</TableCell>
                  <TableCell>{f.actual_margin}%</TableCell>
                </TableRow>
              ))}
              {financials.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4">
                    Nenhum registro
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
