import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { useToast } from '@/hooks/use-toast'
import { Quote, ServiceOrder } from '@/types'
import { getOrderDetails, getQuoteByOrderId, saveQuote } from '@/services/orders'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Plus, Trash2, Send, Save, CheckCircle, XCircle, Calculator } from 'lucide-react'

interface Material {
  id: string
  name: string
  quantity: number
}

export default function QuotePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [order, setOrder] = useState<ServiceOrder | null>(null)
  const [quote, setQuote] = useState<Quote | null>(null)
  const [loading, setLoading] = useState(true)

  const [estimatedHours, setEstimatedHours] = useState<number>(0)
  const [estimatedCost, setEstimatedCost] = useState<number>(0)
  const [suggestedMargin, setSuggestedMargin] = useState<number>(0)
  const [suggestedPrice, setSuggestedPrice] = useState<number>(0)
  const [observations, setObservations] = useState('')
  const [materials, setMaterials] = useState<Material[]>([])

  useEffect(() => {
    async function loadData() {
      if (!id) return
      try {
        const o = await getOrderDetails(id)
        setOrder(o)

        const q = await getQuoteByOrderId(id)
        if (q) {
          setQuote(q)
          setEstimatedHours(q.estimated_hours || 0)
          setEstimatedCost(q.estimated_cost || 0)
          setSuggestedMargin(q.suggested_margin || 0)
          setSuggestedPrice(q.suggested_price || 0)
          setObservations(q.observations || '')
          setMaterials(q.materials || [])
        }
      } catch (err) {
        toast({ title: 'Erro ao carregar dados', variant: 'destructive' })
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [id])

  const handleCostChange = (val: number) => {
    setEstimatedCost(val)
    setSuggestedPrice(Number((val * (1 + suggestedMargin / 100)).toFixed(2)))
  }

  const handleMarginChange = (val: number) => {
    setSuggestedMargin(val)
    setSuggestedPrice(Number((estimatedCost * (1 + val / 100)).toFixed(2)))
  }

  const handlePriceChange = (val: number) => {
    setSuggestedPrice(val)
    if (estimatedCost > 0) {
      setSuggestedMargin(Number(((val / estimatedCost - 1) * 100).toFixed(2)))
    }
  }

  const handleSave = async (statusOverride?: string) => {
    if (!order) return
    try {
      const data = {
        service_order: order.id,
        estimated_hours: estimatedHours,
        estimated_cost: estimatedCost,
        suggested_margin: suggestedMargin,
        suggested_price: suggestedPrice,
        materials,
        observations,
        status: statusOverride || quote?.status || 'rascunho',
      }

      const saved = await saveQuote(quote?.id ? { ...data, id: quote.id } : data)
      setQuote(saved)

      // Update order status if explicitly approved
      if (statusOverride === 'aprovado') {
        await pb.collection('service_orders').update(order.id, { status: 'aprovado' })
        setOrder((prev) => (prev ? { ...prev, status: 'aprovado' } : null))
      } else if (!quote) {
        await pb.collection('service_orders').update(order.id, { status: 'orçamento' })
        setOrder((prev) => (prev ? { ...prev, status: 'orçamento' } : null))
      }

      if (!statusOverride) {
        toast({ title: 'Orçamento salvo com sucesso!' })
      }
    } catch (err) {
      toast({ title: 'Erro ao salvar orçamento', variant: 'destructive' })
    }
  }

  const handleApprove = async () => {
    await handleSave('aprovado')
    toast({ title: 'Orçamento aprovado e OS atualizada!' })
  }

  const handleReject = async () => {
    await handleSave('reprovado')
    toast({ title: 'Orçamento reprovado.' })
  }

  const sendWhatsApp = () => {
    if (!order?.expand?.customer?.phone) {
      toast({ title: 'Cliente sem telefone cadastrado.', variant: 'destructive' })
      return
    }
    const phone = order.expand.customer.phone.replace(/\D/g, '')
    const text = `Olá, ${order.customer_name}! Segue a proposta para o serviço de ${order.service_type}.\n\n*Preço Proposto:* R$ ${suggestedPrice.toFixed(2).replace('.', ',')}\n*Tempo Estimado:* ${estimatedHours}h\n\n${observations ? `*Observações:*\n${observations}\n\n` : ''}Ficamos à disposição para qualquer dúvida ou para prosseguir com o agendamento!`
    const url = `https://wa.me/55${phone}?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
  }

  if (loading || !order) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <Skeleton className="h-10 w-64 mb-6" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Orçamento e Proposta
            </h1>
            <p className="text-slate-500 text-sm">
              OS {order.id.slice(0, 8)} • {order.customer_name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {quote?.status && (
            <Badge
              variant={
                quote.status === 'aprovado'
                  ? 'default'
                  : quote.status === 'reprovado'
                    ? 'destructive'
                    : 'secondary'
              }
              className="capitalize mr-2"
            >
              {quote.status}
            </Badge>
          )}
          <Button variant="outline" onClick={() => handleSave()}>
            <Save className="w-4 h-4 mr-2" /> Salvar Rascunho
          </Button>
          <Button onClick={sendWhatsApp} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <Send className="w-4 h-4 mr-2" /> Enviar pelo WhatsApp
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Parâmetros Técnicos</CardTitle>
              <CardDescription>
                Defina o escopo de horas e materiais para o serviço.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Horas Estimadas (h)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    value={estimatedHours || ''}
                    onChange={(e) => setEstimatedHours(Number(e.target.value))}
                    placeholder="Ex: 4.5"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Materiais Necessários</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setMaterials([
                        ...materials,
                        { id: Math.random().toString(36).slice(2), name: '', quantity: 1 },
                      ])
                    }
                  >
                    <Plus className="w-4 h-4 mr-2" /> Adicionar Material
                  </Button>
                </div>

                {materials.length === 0 ? (
                  <div className="text-center p-4 border rounded-md border-dashed text-sm text-slate-500">
                    Nenhum material adicionado.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {materials.map((mat) => (
                      <div key={mat.id} className="flex items-center gap-3">
                        <Input
                          placeholder="Nome do material"
                          value={mat.name}
                          onChange={(e) =>
                            setMaterials(
                              materials.map((m) =>
                                m.id === mat.id ? { ...m, name: e.target.value } : m,
                              ),
                            )
                          }
                          className="flex-1"
                        />
                        <div className="w-24">
                          <Input
                            type="number"
                            min="1"
                            value={mat.quantity || ''}
                            onChange={(e) =>
                              setMaterials(
                                materials.map((m) =>
                                  m.id === mat.id ? { ...m, quantity: Number(e.target.value) } : m,
                                ),
                              )
                            }
                            placeholder="Qtd"
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setMaterials(materials.filter((m) => m.id !== mat.id))}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Observações da Proposta</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Observações internas ou externas sobre a proposta..."
                className="min-h-[120px]"
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-emerald-100 bg-emerald-50/20">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calculator className="w-5 h-5 text-emerald-600" /> Precificação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Custo Estimado (R$)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={estimatedCost || ''}
                  onChange={(e) => handleCostChange(Number(e.target.value))}
                  placeholder="Ex: 250.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Margem Sugerida (%)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  value={suggestedMargin || ''}
                  onChange={(e) => handleMarginChange(Number(e.target.value))}
                  placeholder="Ex: 30"
                />
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <Label className="text-emerald-800 font-semibold">Preço Proposto (R$)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  className="text-lg font-bold border-emerald-200 focus-visible:ring-emerald-500"
                  value={suggestedPrice || ''}
                  onChange={(e) => handlePriceChange(Number(e.target.value))}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Ações de Fluxo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={handleApprove}
                disabled={quote?.status === 'aprovado'}
              >
                <CheckCircle className="w-4 h-4 mr-2" /> Aprovar Proposta
              </Button>
              <Button
                variant="outline"
                className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                onClick={handleReject}
                disabled={quote?.status === 'reprovado'}
              >
                <XCircle className="w-4 h-4 mr-2" /> Reprovar Proposta
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
