import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { ServiceOrder } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileText, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export default function CustomerPortal() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<ServiceOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.cliente_id) {
      setLoading(false)
      return
    }

    pb.collection('service_orders')
      .getFullList<ServiceOrder>({
        filter: `customer = "${user.cliente_id}"`,
        sort: '-created',
      })
      .then((data) => {
        setOrders(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error(err)
        setLoading(false)
      })
  }, [user])

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Portal do Cliente</h1>
        <p className="text-muted-foreground mt-1">Acompanhe o status e laudos dos seus serviços.</p>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Nenhum serviço encontrado.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-medium">
                  {order.service_type || 'Serviço'}
                </CardTitle>
                <Badge variant={order.status === 'concluído' ? 'default' : 'secondary'}>
                  {order.status}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>
                      <strong>Criado em:</strong> {new Date(order.created).toLocaleDateString()}
                    </p>
                    <p>
                      <strong>Descrição:</strong> {order.description || 'Sem descrição'}
                    </p>
                  </div>
                  <div className="flex items-end">
                    {order.technical_report ? (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline">
                            <FileText className="w-4 h-4 mr-2" />
                            Ver Laudo
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Laudo Técnico</DialogTitle>
                          </DialogHeader>
                          <div className="mt-4 whitespace-pre-wrap text-sm border p-4 rounded-md bg-slate-50">
                            {order.technical_report}
                          </div>
                        </DialogContent>
                      </Dialog>
                    ) : (
                      <Button variant="ghost" disabled>
                        <FileText className="w-4 h-4 mr-2" />
                        Laudo Indisponível
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
