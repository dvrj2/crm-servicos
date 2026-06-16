import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { ServiceOrder, ServiceOrderPhoto } from '@/types'
import { useRealtime } from '@/hooks/use-realtime'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  FileText,
  Loader2,
  Calendar,
  MapPin,
  ExternalLink,
  Camera,
  CheckCircle2,
  Clock,
  Truck,
  Hammer,
  AlertTriangle,
  Image as ImageIcon,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'

export default function CustomerPortal() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<ServiceOrder[]>([])
  const [photos, setPhotos] = useState<ServiceOrderPhoto[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    if (!user?.cliente_id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const ordersData = await pb.collection('service_orders').getFullList<ServiceOrder>({
        filter: `customer = "${user.cliente_id}"`,
        sort: '-created',
      })
      setOrders(ordersData)

      const photosData = await pb
        .collection('service_order_photos')
        .getFullList<ServiceOrderPhoto>({
          filter: `service_order.customer = "${user.cliente_id}"`,
        })
      setPhotos(photosData)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user])

  useRealtime<ServiceOrder>('service_orders', (e) => {
    if (e.record.customer === user?.cliente_id) {
      if (e.action === 'create') {
        setOrders((prev) => [e.record as unknown as ServiceOrder, ...prev])
      } else if (e.action === 'update') {
        setOrders((prev) =>
          prev.map((o) => (o.id === e.record.id ? (e.record as unknown as ServiceOrder) : o)),
        )
      } else if (e.action === 'delete') {
        setOrders((prev) => prev.filter((o) => o.id !== e.record.id))
      }
    }
  })

  useRealtime<ServiceOrderPhoto>('service_order_photos', (e) => {
    setPhotos((prev) => {
      const newPhoto = e.record as unknown as ServiceOrderPhoto
      if (e.action === 'create' || e.action === 'update') {
        const exists = prev.some((p) => p.id === newPhoto.id)
        if (exists) {
          return prev.map((p) => (p.id === newPhoto.id ? newPhoto : p))
        }
        return [...prev, newPhoto]
      } else if (e.action === 'delete') {
        return prev.filter((p) => p.id !== e.record.id)
      }
      return prev
    })
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'concluído':
      case 'faturado':
        return <Badge className="bg-emerald-500 hover:bg-emerald-600">Concluído</Badge>
      case 'executando':
        return <Badge className="bg-blue-500 hover:bg-blue-600">Em Execução</Badge>
      case 'agendado':
        return <Badge className="bg-purple-500 hover:bg-purple-600">Agendado</Badge>
      case 'cancelado':
        return <Badge variant="destructive">Cancelado</Badge>
      case 'risco':
        return <Badge variant="destructive">Em Risco</Badge>
      case 'aguardando cliente':
        return <Badge className="bg-amber-500 hover:bg-amber-600">Aguardando Você</Badge>
      default:
        return (
          <Badge variant="secondary" className="capitalize">
            {status || 'Novo'}
          </Badge>
        )
    }
  }

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case 'pago':
        return <Badge className="bg-emerald-500 hover:bg-emerald-600">Pago</Badge>
      case 'pendente':
        return <Badge className="bg-amber-500 hover:bg-amber-600">Pendente</Badge>
      case 'vencido':
        return <Badge variant="destructive">Vencido</Badge>
      default:
        return (
          <Badge variant="outline" className="capitalize">
            {status || 'N/A'}
          </Badge>
        )
    }
  }

  const getOperationalStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-slate-500" />
      case 'en_route':
        return <Truck className="w-4 h-4 text-blue-500" />
      case 'in_progress':
        return <Hammer className="w-4 h-4 text-amber-500" />
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />
      case 'paused':
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-slate-500" />
    }
  }

  const getOperationalStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendente'
      case 'en_route':
        return 'Técnico a caminho'
      case 'in_progress':
        return 'Serviço em andamento'
      case 'completed':
        return 'Finalizado'
      case 'paused':
        return 'Pausado'
      default:
        return 'Não iniciado'
    }
  }

  const activeOrders = useMemo(
    () => orders.filter((o) => !['concluído', 'faturado', 'cancelado'].includes(o.status)),
    [orders],
  )

  const historyOrders = useMemo(
    () => orders.filter((o) => ['concluído', 'faturado', 'cancelado'].includes(o.status)),
    [orders],
  )

  const paymentOrders = useMemo(
    () =>
      orders.filter(
        (o) =>
          o.payment_status && o.payment_status !== 'simulado_negado' && o.status !== 'cancelado',
      ),
    [orders],
  )

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const renderDocumentationDialog = (order: ServiceOrder) => {
    const orderPhotos = photos.filter((p) => p.service_order === order.id)
    const beforePhotos = orderPhotos.filter((p) => p.stage === 'before')
    const afterPhotos = orderPhotos.filter((p) => p.stage === 'after')

    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="w-full sm:w-auto">
            <FileText className="w-4 h-4 mr-2" />
            Documentação Técnica
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl max-h-[85vh] p-0 overflow-hidden flex flex-col">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle>Documentação - {order.service_type || 'Serviço'}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-6">
              {order.diagnosis && (
                <div>
                  <h3 className="font-semibold text-sm mb-2 text-slate-700">Diagnóstico</h3>
                  <div className="p-3 bg-slate-50 rounded-md text-sm whitespace-pre-wrap border border-slate-100">
                    {order.diagnosis}
                  </div>
                </div>
              )}
              {order.activities_performed && (
                <div>
                  <h3 className="font-semibold text-sm mb-2 text-slate-700">
                    Atividades Realizadas
                  </h3>
                  <div className="p-3 bg-slate-50 rounded-md text-sm whitespace-pre-wrap border border-slate-100">
                    {order.activities_performed}
                  </div>
                </div>
              )}
              {order.technical_report && (
                <div>
                  <h3 className="font-semibold text-sm mb-2 text-slate-700">Laudo Técnico</h3>
                  <div className="p-3 bg-slate-50 rounded-md text-sm whitespace-pre-wrap border border-slate-100">
                    {order.technical_report}
                  </div>
                </div>
              )}
              {!order.diagnosis && !order.activities_performed && !order.technical_report && (
                <div className="text-center p-6 bg-slate-50 rounded-md border border-slate-100">
                  <p className="text-sm text-muted-foreground">
                    Nenhuma documentação em texto disponível para este serviço.
                  </p>
                </div>
              )}

              <div>
                <h3 className="font-semibold text-sm mb-3 flex items-center text-slate-700">
                  <Camera className="w-4 h-4 mr-2" /> Galeria de Fotos
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                      Antes do Serviço
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {beforePhotos.map((p) => (
                        <div
                          key={p.id}
                          className="aspect-square relative rounded-md overflow-hidden border"
                        >
                          <img
                            src={pb.files.getUrl(p, p.file)}
                            alt="Antes"
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      ))}
                      {beforePhotos.length === 0 && (
                        <div className="col-span-2 aspect-[2/1] bg-slate-50 rounded-md border flex flex-col items-center justify-center text-slate-400">
                          <ImageIcon className="w-8 h-8 mb-2 opacity-20" />
                          <span className="text-xs">Sem fotos</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                      Depois do Serviço
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {afterPhotos.map((p) => (
                        <div
                          key={p.id}
                          className="aspect-square relative rounded-md overflow-hidden border"
                        >
                          <img
                            src={pb.files.getUrl(p, p.file)}
                            alt="Depois"
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      ))}
                      {afterPhotos.length === 0 && (
                        <div className="col-span-2 aspect-[2/1] bg-slate-50 rounded-md border flex flex-col items-center justify-center text-slate-400">
                          <ImageIcon className="w-8 h-8 mb-2 opacity-20" />
                          <span className="text-xs">Sem fotos</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-5xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Portal do Cliente</h1>
        <p className="text-muted-foreground mt-1">
          Acompanhe seus serviços, visualize laudos e gerencie pagamentos.
        </p>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8 bg-slate-100/50 p-1 rounded-lg">
          <TabsTrigger value="active" className="rounded-md">
            Em Andamento
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-md">
            Histórico
          </TabsTrigger>
          <TabsTrigger value="payments" className="rounded-md">
            Pagamentos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeOrders.length === 0 ? (
            <Card className="border-dashed border-2 bg-slate-50/50">
              <CardContent className="py-12 text-center text-muted-foreground flex flex-col items-center">
                <Clock className="w-12 h-12 mb-4 opacity-20" />
                <p>Nenhum serviço em andamento no momento.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {activeOrders.map((order) => (
                <Card key={order.id} className="shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{order.service_type || 'Serviço'}</CardTitle>
                        <CardDescription className="flex items-center gap-1.5 mt-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {order.scheduled_date
                            ? new Date(order.scheduled_date).toLocaleDateString()
                            : 'Aguardando agendamento'}
                        </CardDescription>
                      </div>
                      {getStatusBadge(order.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                      {order.description || 'Sem descrição detalhada.'}
                    </p>
                    <div className="flex items-center gap-2.5 bg-slate-50 p-3 rounded-lg border border-slate-100">
                      {getOperationalStatusIcon(order.operational_status || 'pending')}
                      <span className="text-sm font-medium text-slate-700">
                        {getOperationalStatusText(order.operational_status || 'pending')}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {historyOrders.length === 0 ? (
            <Card className="border-dashed border-2 bg-slate-50/50">
              <CardContent className="py-12 text-center text-muted-foreground flex flex-col items-center">
                <FileText className="w-12 h-12 mb-4 opacity-20" />
                <p>O histórico de serviços está vazio.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {historyOrders.map((order) => (
                <Card key={order.id} className="shadow-sm">
                  <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg">{order.service_type || 'Serviço'}</CardTitle>
                      <CardDescription className="flex items-center gap-1.5 mt-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Finalizado em:{' '}
                        {order.finished_at
                          ? new Date(order.finished_at).toLocaleDateString()
                          : new Date(order.updated).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    {getStatusBadge(order.status)}
                  </CardHeader>
                  <CardContent className="pb-4">
                    <p className="text-sm text-slate-600">
                      {order.description || 'Serviço concluído.'}
                    </p>
                  </CardContent>
                  <CardFooter className="pt-0 flex justify-end">
                    {renderDocumentationDialog(order)}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          {paymentOrders.length === 0 ? (
            <Card className="border-dashed border-2 bg-slate-50/50">
              <CardContent className="py-12 text-center text-muted-foreground flex flex-col items-center">
                <FileText className="w-12 h-12 mb-4 opacity-20" />
                <p>Nenhuma pendência financeira ou pagamento registrado.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {paymentOrders.map((order) => (
                <Card key={order.id} className="shadow-sm border-l-4 border-l-slate-300">
                  <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-base">{order.service_type || 'Serviço'}</h3>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>
                          {order.finished_at
                            ? new Date(order.finished_at).toLocaleDateString()
                            : order.scheduled_date
                              ? new Date(order.scheduled_date).toLocaleDateString()
                              : ''}
                        </span>
                        {order.final_value ? (
                          <span className="font-medium text-slate-900">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            }).format(order.final_value)}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                      <div className="flex-1 sm:flex-none flex justify-start sm:justify-end">
                        {getPaymentBadge(order.payment_status || 'pendente')}
                      </div>

                      {order.payment_link && order.payment_status !== 'pago' && (
                        <Button
                          size="sm"
                          onClick={() => window.open(order.payment_link, '_blank')}
                          className="shrink-0"
                        >
                          Pagar Agora
                          <ExternalLink className="w-4 h-4 ml-2" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
