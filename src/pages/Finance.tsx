import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { DollarSign, CheckCircle2, XCircle, AlertCircle, Clock } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { Financial, ServiceOrder } from '@/types'
import { useSandbox } from '@/hooks/use-sandbox'
import { toast } from 'sonner'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { useRealtime } from '@/hooks/use-realtime'

export default function Finance() {
  const [financials, setFinancials] = useState<
    (Financial & { expand?: { service_order?: ServiceOrder } })[]
  >([])
  const { isSandbox } = useSandbox()

  const loadFinancials = async () => {
    try {
      const data = await pb.collection('financials').getFullList({
        expand: 'service_order,execution',
        sort: '-created',
      })
      setFinancials(data as any)
    } catch (e) {
      toast.error('Erro ao carregar dados financeiros')
    }
  }

  useEffect(() => {
    loadFinancials()
  }, [])

  useRealtime('financials', () => {
    loadFinancials()
  })

  const simulatePayment = async (fin: Financial, success: boolean) => {
    if (!isSandbox) {
      toast.error('Modo Sandbox inativo. Simulação não permitida.')
      return
    }

    try {
      if (success) {
        if (fin.service_order) {
          await pb.send('/backend/v1/webhook/payment-confirmed', {
            method: 'POST',
            body: JSON.stringify({ service_order: fin.service_order }),
          })
        } else {
          await pb.collection('financials').update(fin.id, { payment_status: 'pago' })
        }
        toast.success('Pagamento confirmado simulado com sucesso!')
      } else {
        await pb.collection('financials').update(fin.id, { payment_status: 'erro' })
        toast.success('Falha de pagamento simulada com sucesso!')
      }
    } catch (e) {
      toast.error('Erro na simulação', { description: getErrorMessage(e) })
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Financeiro</h2>
          <p className="text-slate-500">Gestão de faturamentos e pagamentos.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Recebido</CardTitle>
            <DollarSign className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R${' '}
              {financials
                .filter((f) => f.payment_status === 'pago')
                .reduce((acc, curr) => acc + (curr.final_value || 0), 0)
                .toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">A Receber</CardTitle>
            <Clock className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R${' '}
              {financials
                .filter((f) => f.payment_status === 'pendente')
                .reduce((acc, curr) => acc + (curr.final_value || 0), 0)
                .toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Inadimplência (Erro)
            </CardTitle>
            <AlertCircle className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              R${' '}
              {financials
                .filter((f) => f.payment_status === 'erro' || f.payment_status === 'vencido')
                .reduce((acc, curr) => acc + (curr.final_value || 0), 0)
                .toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Faturas</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-4">
              {financials.map((fin) => (
                <div
                  key={fin.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg gap-4 bg-white hover:bg-slate-50 transition-colors"
                >
                  <div>
                    <p className="font-semibold text-slate-800">
                      {fin.expand?.service_order ? (
                        <>
                          OS: {fin.expand.service_order.customer_name || 'Sem Cliente'}
                          <span className="text-slate-400 text-xs ml-2 font-mono">
                            #{fin.service_order?.slice(0, 8)}
                          </span>
                        </>
                      ) : (
                        'Faturamento Avulso / Sem OS'
                      )}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      Valor Final:{' '}
                      <strong className="text-slate-900">
                        R$ {fin.final_value?.toFixed(2) || '0.00'}
                      </strong>
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 w-full sm:w-auto">
                    <Badge
                      variant={
                        fin.payment_status === 'pago'
                          ? 'default'
                          : fin.payment_status === 'erro'
                            ? 'destructive'
                            : 'secondary'
                      }
                      className="uppercase text-[10px] tracking-wide"
                    >
                      {fin.payment_status || 'desconhecido'}
                    </Badge>

                    {isSandbox && fin.payment_status !== 'pago' && (
                      <div className="flex gap-2 w-full sm:w-auto">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-green-200 text-green-700 hover:bg-green-50 w-full sm:w-auto"
                          onClick={() => simulatePayment(fin, true)}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" /> Aprovar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-200 text-red-700 hover:bg-red-50 w-full sm:w-auto"
                          onClick={() => simulatePayment(fin, false)}
                        >
                          <XCircle className="w-4 h-4 mr-1" /> Negar
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {financials.length === 0 && (
                <div className="text-center text-slate-500 py-12 flex flex-col items-center">
                  <DollarSign className="w-12 h-12 text-slate-300 mb-3" />
                  <p>Nenhuma fatura encontrada no sistema.</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
