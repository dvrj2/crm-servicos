import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ServiceOrder, ServiceOrderPhoto } from '@/types'
import { getServiceOrder, getOrderPhotos, updateOrder } from '@/services/api'
import pb from '@/lib/pocketbase/client'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  CheckCircle2,
  FileText,
  Send,
  CreditCard,
  AlertTriangle,
  ArrowLeft,
  Camera,
  Clock,
  Printer,
} from 'lucide-react'

export default function Report() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [order, setOrder] = useState<ServiceOrder | null>(null)
  const [photos, setPhotos] = useState<ServiceOrderPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    diagnosis: '',
    activities_performed: '',
    current_condition: '',
    recommendations: '',
  })

  const loadData = async () => {
    if (!id) return
    try {
      setLoading(true)
      const [orderData, photosData] = await Promise.all([getServiceOrder(id), getOrderPhotos(id)])
      setOrder(orderData)
      setPhotos(photosData)
      setFormData({
        diagnosis: orderData.diagnosis || '',
        activities_performed: orderData.activities_performed || '',
        current_condition: orderData.current_condition || '',
        recommendations: orderData.recommendations || '',
      })
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar a OS.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [id])

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[50vh]">
        <h2 className="text-xl font-bold">OS não encontrada.</h2>
        <Button variant="link" onClick={() => navigate('/')}>
          Voltar
        </Button>
      </div>
    )
  }

  const beforePhotos = photos.filter((p) => p.stage === 'before')
  const afterPhotos = photos.filter((p) => p.stage === 'after')
  const hasBeforePhoto = beforePhotos.length > 0
  const hasAfterPhoto = afterPhotos.length > 0
  const hasSignature = !!order.signature
  const hasPendingChecklist = order.has_pending_checklist

  const isReportReady = hasBeforePhoto && hasAfterPhoto && hasSignature && !hasPendingChecklist

  const handleSave = async (complete: boolean = false) => {
    setSaving(true)
    try {
      const payload: Partial<ServiceOrder> = {
        ...formData,
      }
      if (complete) {
        payload.status = 'concluido'
      }
      await updateOrder(order.id, payload)
      toast({ title: 'Sucesso', description: 'Laudo salvo com sucesso.' })
      if (complete) loadData()
    } catch (err) {
      toast({ title: 'Erro', description: 'Falha ao salvar.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handlePayment = async () => {
    try {
      await updateOrder(order.id, { status: 'faturado' })
      toast({ title: 'Faturado', description: 'A OS foi marcada como faturada.' })
      loadData()
    } catch (err) {
      toast({ title: 'Erro', description: 'Falha ao faturar.', variant: 'destructive' })
    }
  }

  const handleWhatsApp = () => {
    const text = `Olá! Aqui é o laudo técnico do serviço na OS ${order.id}. ${formData.diagnosis ? `Diagnóstico: ${formData.diagnosis}` : ''}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  const handleGeneratePDF = () => {
    window.print()
  }

  const signatureUrl = order.signature ? pb.files.getURL(order, order.signature) : null

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6 pb-24">
      <div className="flex items-center gap-4 border-b pb-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="print:hidden">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Laudo Técnico e Entrega</h1>
          <p className="text-slate-500">
            OS: <span className="font-mono">{order.id}</span> - {order.customer_name}
          </p>
        </div>
      </div>

      {order.is_rework && (
        <Alert className="bg-orange-50 border-orange-200 text-orange-900">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertTitle>Atenção: OS de Retrabalho</AlertTitle>
          <AlertDescription>
            Este serviço está marcado como retrabalho. Revise o histórico antes de aplicar
            cobranças.
          </AlertDescription>
        </Alert>
      )}

      {!isReportReady && (
        <Alert variant="destructive" className="print:hidden">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Requisitos Operacionais Pendentes</AlertTitle>
          <AlertDescription>
            A entrega do laudo está bloqueada até que as seguintes pendências sejam resolvidas:
            <ul className="list-disc pl-5 mt-2 space-y-1">
              {hasPendingChecklist && <li>O checklist possui itens pendentes.</li>}
              {!hasSignature && <li>Assinatura do cliente não foi coletada.</li>}
              {!hasBeforePhoto && <li>Falta pelo menos uma foto de "Antes".</li>}
              {!hasAfterPhoto && <li>Falta pelo menos uma foto de "Depois".</li>}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-500" /> Resumo do Serviço
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-slate-500 block">Início</span>
                <span className="font-medium">
                  {order.started_at ? new Date(order.started_at).toLocaleString('pt-BR') : '-'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Término</span>
                <span className="font-medium">
                  {order.finished_at ? new Date(order.finished_at).toLocaleString('pt-BR') : '-'}
                </span>
              </div>
            </div>
            <div>
              <span className="text-slate-500 block">Tipo de Serviço</span>
              <span className="font-medium">{order.service_type}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Materiais Utilizados</span>
              <p className="font-medium bg-slate-50 p-2 rounded border mt-1">
                {order.materials_used || 'Nenhum material registrado.'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-slate-500" /> Detalhes do Laudo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Diagnóstico</Label>
              <Textarea
                value={formData.diagnosis}
                onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                placeholder="Qual era o problema encontrado?"
                className="resize-none"
                rows={2}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Atividades Realizadas</Label>
              <Textarea
                value={formData.activities_performed}
                onChange={(e) => setFormData({ ...formData, activities_performed: e.target.value })}
                placeholder="Descreva o que foi feito..."
                className="resize-none"
                rows={2}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Condição Atual</Label>
              <Textarea
                value={formData.current_condition}
                onChange={(e) => setFormData({ ...formData, current_condition: e.target.value })}
                placeholder="Como o equipamento/sistema foi deixado?"
                className="resize-none"
                rows={2}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Recomendações Futuras</Label>
              <Textarea
                value={formData.recommendations}
                onChange={(e) => setFormData({ ...formData, recommendations: e.target.value })}
                placeholder="O que o cliente deve fazer a seguir?"
                className="resize-none"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Camera className="w-5 h-5 text-slate-500" /> Evidências Fotográficas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-medium text-sm mb-3">Fotos "Antes"</h3>
            {beforePhotos.length === 0 ? (
              <p className="text-sm text-slate-500 italic">Nenhuma foto registrada.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {beforePhotos.map((p) => (
                  <div
                    key={p.id}
                    className="relative aspect-square rounded-md overflow-hidden bg-slate-100 border"
                  >
                    <img
                      src={
                        p.file
                          ? pb.files.getURL(p, p.file)
                          : 'https://img.usecurling.com/p/200/200?q=tools&color=gray'
                      }
                      alt="Antes"
                      className="object-cover w-full h-full"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <h3 className="font-medium text-sm mb-3">Fotos "Depois"</h3>
            {afterPhotos.length === 0 ? (
              <p className="text-sm text-slate-500 italic">Nenhuma foto registrada.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {afterPhotos.map((p) => (
                  <div
                    key={p.id}
                    className="relative aspect-square rounded-md overflow-hidden bg-slate-100 border"
                  >
                    <img
                      src={
                        p.file
                          ? pb.files.getURL(p, p.file)
                          : 'https://img.usecurling.com/p/200/200?q=tools&color=green'
                      }
                      alt="Depois"
                      className="object-cover w-full h-full"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-slate-500" /> Assinatura do Cliente
          </CardTitle>
        </CardHeader>
        <CardContent>
          {signatureUrl ? (
            <div className="max-w-xs border rounded-lg overflow-hidden bg-white p-2">
              <img src={signatureUrl} alt="Assinatura" className="w-full h-auto" />
            </div>
          ) : (
            <p className="text-sm text-slate-500 italic">
              Assinatura não coletada na tela de execução.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg flex items-center justify-between z-10 sm:static sm:bg-transparent sm:border-none sm:shadow-none sm:p-0 print:hidden">
        <div className="hidden sm:flex gap-2">
          <Button variant="outline" onClick={() => handleSave(false)} disabled={saving}>
            Salvar Rascunho
          </Button>
        </div>
        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <Button
            variant="outline"
            className="flex-shrink-0"
            disabled={!isReportReady}
            onClick={handleGeneratePDF}
          >
            <Printer className="w-4 h-4 mr-2" /> PDF
          </Button>
          <Button
            variant="outline"
            className="flex-shrink-0 text-green-600 hover:text-green-700 hover:bg-green-50"
            disabled={!isReportReady}
            onClick={handleWhatsApp}
          >
            <Send className="w-4 h-4 mr-2" /> WhatsApp
          </Button>
          <Button
            variant="outline"
            className="flex-shrink-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            disabled={!isReportReady}
            onClick={handlePayment}
          >
            <CreditCard className="w-4 h-4 mr-2" /> Cobrar
          </Button>
          <Button
            className="flex-shrink-0 ml-auto"
            onClick={() => handleSave(true)}
            disabled={saving || !isReportReady}
          >
            <CheckCircle2 className="w-4 h-4 mr-2" /> Entregar
          </Button>
        </div>
      </div>
    </div>
  )
}
