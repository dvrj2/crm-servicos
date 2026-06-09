import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { ServiceOrder, ServiceOrderMessage, ServiceOrderPhoto } from '@/types'
import {
  getOrderDetails,
  getOrderBeforePhotos,
  getOrderMessages,
  createOrderMessage,
  getCustomerHistory,
} from '@/services/orders'
import { useRealtime } from '@/hooks/use-realtime'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'
import {
  Phone,
  MapPin,
  Clock,
  ArrowLeft,
  Send,
  Calendar,
  Camera,
  UserSquare,
  ShieldAlert,
  AlertCircle,
  FileText,
  MessageSquare,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()

  const [order, setOrder] = useState<ServiceOrder | null>(null)
  const [photos, setPhotos] = useState<ServiceOrderPhoto[]>([])
  const [messages, setMessages] = useState<ServiceOrderMessage[]>([])
  const [history, setHistory] = useState<ServiceOrder[]>([])
  const [loading, setLoading] = useState(true)

  const [newMessage, setNewMessage] = useState('')

  const loadData = async () => {
    if (!id) return
    try {
      const o = await getOrderDetails(id)
      setOrder(o)

      const [p, m] = await Promise.all([getOrderBeforePhotos(id), getOrderMessages(id)])
      setPhotos(p)
      setMessages(m)

      if (o.customer) {
        const h = await getCustomerHistory(o.customer, id)
        setHistory(h)
      }
    } catch (err) {
      toast({ title: 'Erro ao carregar detalhes', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [id])

  useRealtime('service_order_messages', (e) => {
    if (e.record.service_order === id) {
      getOrderMessages(id).then(setMessages)
    }
  })

  useRealtime('service_orders', (e) => {
    if (e.record.id === id) {
      getOrderDetails(id).then(setOrder)
    }
  })

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !user || !order) return
    try {
      await createOrderMessage({
        service_order: order.id,
        sender: user.id,
        message: newMessage.trim(),
      })
      setNewMessage('')
    } catch {
      toast({ title: 'Erro ao enviar mensagem', variant: 'destructive' })
    }
  }

  const handleRequestPhotos = async () => {
    if (!order) return
    try {
      await pb.collection('service_orders').update(order.id, { has_pending_checklist: true })
      toast({ title: 'Fotos solicitadas com sucesso!' })
    } catch {
      toast({ title: 'Erro ao solicitar fotos', variant: 'destructive' })
    }
  }

  const handleEscalate = async () => {
    if (!order) return
    try {
      await pb.collection('service_orders').update(order.id, { status: 'qualificado' })
      toast({ title: 'Encaminhado ao supervisor com sucesso!' })
    } catch {
      toast({ title: 'Erro ao encaminhar', variant: 'destructive' })
    }
  }

  if (loading || !order) {
    return (
      <div className="p-6">
        <Skeleton className="h-10 w-48 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-[400px]" />
          <Skeleton className="h-[400px] lg:col-span-2" />
        </div>
      </div>
    )
  }

  const getSLAStatus = () => {
    if (!order.sla_deadline) return { label: 'Sem SLA', color: 'text-slate-500', isLate: false }
    const deadline = new Date(order.sla_deadline).getTime()
    const now = new Date().getTime()
    const diff = deadline - now
    const hoursRemaining = diff / (1000 * 60 * 60)

    if (diff < 0) return { label: 'Atrasado', color: 'text-red-600', isLate: true }
    if (hoursRemaining < 1)
      return {
        label: `${Math.round(hoursRemaining * 60)}m restantes`,
        color: 'text-red-600',
        isLate: false,
      }
    return {
      label: `${Math.round(hoursRemaining)}h restantes`,
      color: 'text-emerald-600',
      isLate: false,
    }
  }

  const sla = getSLAStatus()

  const urgencyColors: Record<string, string> = {
    crítica: 'bg-red-100 text-red-800 border-red-200',
    média: 'bg-amber-100 text-amber-800 border-amber-200',
    baixa: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  }

  const customer = order.expand?.customer

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Solicitação {order.id.slice(0, 8)}
          </h1>
          <p className="text-slate-500">{order.service_type}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* SLA & Urgency Tracker */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> Prioridade e SLA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Urgência</span>
                <Badge
                  variant="outline"
                  className={cn(
                    'capitalize text-[11px] px-2 py-0.5',
                    urgencyColors[order.urgency] || 'bg-slate-100',
                  )}
                >
                  {order.urgency}
                </Badge>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Status Atual</span>
                <Badge variant="secondary" className="capitalize">
                  {order.status}
                </Badge>
              </div>
              <Separator />
              <div>
                <span className="text-sm text-slate-500 mb-1.5 block">Tempo Restante (SLA)</span>
                <div className="flex items-center gap-2">
                  <Clock className={cn('w-4 h-4', sla.color)} />
                  <span className={cn('font-semibold', sla.color)}>{sla.label}</span>
                </div>
                {order.sla_deadline && (
                  <p className="text-xs text-slate-400 mt-1">
                    Prazo final: {new Date(order.sla_deadline).toLocaleString('pt-BR')}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <UserSquare className="w-4 h-4" /> Informações do Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-slate-900">{order.customer_name}</h4>
                {customer?.tipo_cliente && (
                  <Badge variant="outline" className="mt-1 text-[10px] capitalize text-slate-500">
                    {customer.tipo_cliente}
                  </Badge>
                )}
              </div>
              <div className="space-y-3 text-sm mt-2">
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{customer?.phone || 'Não informado'}</span>
                </div>
                <div className="flex items-start gap-2 text-slate-600">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span className="leading-snug">
                    {customer?.address || order.region || 'Não informado'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Operational Actions */}
          <Card className="bg-slate-50/50 border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Ações Operacionais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full justify-start"
                onClick={() => navigate(`/order/${order.id}/quote`)}
              >
                <FileText className="w-4 h-4 mr-2" />
                {order.status === 'orçamento' || order.status === 'aprovado'
                  ? 'Ver Orçamento'
                  : 'Orçamento e Proposta'}
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start bg-white"
                onClick={handleRequestPhotos}
              >
                <Camera className="w-4 h-4 mr-2 text-slate-500" />
                Solicitar Fotos Adicionais
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start bg-white text-amber-700 hover:text-amber-800 hover:bg-amber-50 border-amber-200"
                onClick={handleEscalate}
              >
                <ShieldAlert className="w-4 h-4 mr-2" />
                Encaminhar p/ Supervisor
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Problem Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Análise do Problema</CardTitle>
              <CardDescription>Categoria sugerida: {order.category || 'Geral'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="text-sm font-semibold mb-2 text-slate-700">Descrição Relatada</h4>
                <p className="text-slate-600 text-sm whitespace-pre-wrap bg-slate-50 p-4 rounded-md border border-slate-100">
                  {order.description ||
                    'Nenhuma descrição detalhada fornecida pelo cliente no momento da abertura.'}
                </p>
              </div>

              {photos.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-3 text-slate-700">Fotos Iniciais</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {photos.map((photo) => (
                      <div
                        key={photo.id}
                        className="aspect-square rounded-md overflow-hidden bg-slate-100 border border-slate-200"
                      >
                        <img
                          src={`${import.meta.env.VITE_POCKETBASE_URL}/api/files/service_order_photos/${photo.id}/${photo.file}`}
                          alt="Evidência do problema"
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Internal Messages */}
            <Card className="flex flex-col h-[400px]">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-slate-500" /> Histórico Interno
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 p-0 flex flex-col overflow-hidden bg-slate-50/30">
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.length === 0 ? (
                      <div className="text-center text-sm text-slate-500 py-8">
                        Nenhuma nota ou mensagem registrada.
                      </div>
                    ) : (
                      messages.map((msg) => {
                        const isMe = msg.sender === user?.id
                        return (
                          <div
                            key={msg.id}
                            className={cn(
                              'flex flex-col gap-1 max-w-[85%]',
                              isMe ? 'ml-auto items-end' : '',
                            )}
                          >
                            <div className="flex items-center gap-2 px-1">
                              {!isMe && (
                                <Avatar className="h-5 w-5">
                                  {msg.expand?.sender?.avatar && (
                                    <AvatarImage
                                      src={`${import.meta.env.VITE_POCKETBASE_URL}/api/files/users/${msg.expand.sender.id}/${msg.expand.sender.avatar}`}
                                    />
                                  )}
                                  <AvatarFallback className="text-[9px]">
                                    {msg.expand?.sender?.name?.slice(0, 2) || 'U'}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              <span className="text-xs font-medium text-slate-500">
                                {isMe ? 'Você' : msg.expand?.sender?.name}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {new Date(msg.created).toLocaleTimeString('pt-BR', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            <div
                              className={cn(
                                'p-2.5 rounded-lg text-sm shadow-sm',
                                isMe
                                  ? 'bg-slate-900 text-white rounded-tr-none'
                                  : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none',
                              )}
                            >
                              {msg.message}
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </ScrollArea>
                <div className="p-3 border-t bg-white mt-auto">
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Input
                      placeholder="Adicionar nota..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="bg-slate-50"
                    />
                    <Button type="submit" size="icon" disabled={!newMessage.trim()}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>

            {/* Location & Service History */}
            <Card className="flex flex-col h-[400px]">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-500" /> Histórico no Local
                </CardTitle>
                <CardDescription className="text-xs">
                  Últimos serviços registrados para este cliente
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 overflow-hidden">
                <ScrollArea className="h-full p-4">
                  <div className="space-y-3">
                    {history.length === 0 ? (
                      <div className="text-center text-sm text-slate-500 py-8">
                        Nenhum serviço anterior encontrado.
                      </div>
                    ) : (
                      history.map((h) => (
                        <div
                          key={h.id}
                          className="flex flex-col p-3 rounded-md border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex justify-between items-start mb-1">
                            <p className="font-medium text-sm text-slate-900">{h.service_type}</p>
                            <Badge variant="outline" className="text-[10px] bg-white">
                              {h.id.slice(0, 5)}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                            <span>{new Date(h.created).toLocaleDateString('pt-BR')}</span>
                            <span>•</span>
                            <span className="capitalize">{h.status}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
