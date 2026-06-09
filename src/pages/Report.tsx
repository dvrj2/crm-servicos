import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ServiceOrder, ServiceOrderPhoto, ServiceOrderChecklistItem } from '@/types'
import { getOrderDetails } from '@/services/orders'
import {
  getOrderPhotos,
  getChecklistItems,
  getExecutionByOrderId,
  generateAIReport,
  updateExecutionOrder,
} from '@/services/execution'
import pb from '@/lib/pocketbase/client'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
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
  Wand2,
} from 'lucide-react'

export default function Report() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [order, setOrder] = useState<ServiceOrder | null>(null)
  const [photos, setPhotos] = useState<ServiceOrderPhoto[]>([])
  const [checklists, setChecklists] = useState<ServiceOrderChecklistItem[]>([])
  const [execution, setExecution] = useState<any | null>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)

  const [reportText, setReportText] = useState('')

  const loadData = async () => {
    if (!id) return
    try {
      setLoading(true)
      const [orderData, photosData, checklistsData, execData] = await Promise.all([
        getOrderDetails(id),
        getOrderPhotos(id),
        getChecklistItems(id),
        getExecutionByOrderId(id),
      ])
      setOrder(orderData)
      setPhotos(photosData)
      setChecklists(checklistsData)
      setExecution(execData)
      setReportText(orderData.technical_report || execData?.technical_report || '')
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
  const hasAfterPhoto = afterPhotos.length > 0
  const signatureUrl = execution?.signature
    ? pb.files.getURL(execution, execution.signature)
    : order.signature
      ? pb.files.getURL(order, order.signature)
      : null
  const hasSignature = !!signatureUrl

  // Parse materials
  let materialsList: any[] = []
  let rawMaterialsText = ''
  try {
    if (execution?.materials_used) {
      const parsed = JSON.parse(execution.materials_used)
      if (Array.isArray(parsed)) {
        materialsList = parsed
      } else if (typeof parsed === 'string') {
        try {
          const doubleParsed = JSON.parse(parsed)
          if (Array.isArray(doubleParsed)) materialsList = doubleParsed
          else rawMaterialsText = parsed
        } catch {
          rawMaterialsText = parsed
        }
      } else {
        rawMaterialsText = String(parsed)
      }
    }
  } catch {
    rawMaterialsText = execution?.materials_used || ''
  }

  const isReportValid = reportText.trim().length > 0
  const canSendWhatsApp = hasAfterPhoto && hasSignature && isReportValid

  let missingItems = []
  if (!hasAfterPhoto) missingItems.push("Foto 'Depois'")
  if (!hasSignature) missingItems.push('Assinatura do Cliente')
  if (!isReportValid) missingItems.push('Laudo Técnico Preenchido')

  const handleGenerateAI = async () => {
    setGenerating(true)
    try {
      const checklistStr = checklists
        .map((c) => `- ${c.task_description}: ${c.is_completed ? 'OK' : 'Pendente'}`)
        .join('\n')
      const notes = execution?.technical_report || order.technical_observations || ''
      const res = await generateAIReport(order.description, notes, checklistStr)
      setReportText(res)
      toast({
        title: 'Laudo Gerado',
        description: 'O laudo foi gerado por IA com sucesso. Revise antes de salvar.',
      })
    } catch (err) {
      toast({ title: 'Erro', description: 'Falha ao gerar o laudo.', variant: 'destructive' })
    } finally {
      setGenerating(false)
    }
  }

  const handleSave = async (complete: boolean = false) => {
    setSaving(true)
    try {
      const payload: Partial<ServiceOrder> = {
        technical_report: reportText,
      }
      if (complete) {
        payload.status = 'concluído'
      }
      await updateExecutionOrder(order.id, payload)
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
      await updateExecutionOrder(order.id, { payment_status: 'pendente' })
      if (execution) {
        try {
          await pb.collection('financials').create({
            execution: execution.id,
            final_value: order.final_value || 0,
            payment_status: 'pendente',
          })
        } catch (e) {
          console.warn('Financials record may already exist or failed to create')
        }
      }
      toast({ title: 'Faturado', description: 'A OS foi marcada para faturamento (Pendente).' })
      loadData()
    } catch (err) {
      toast({ title: 'Erro', description: 'Falha ao faturar.', variant: 'destructive' })
    }
  }

  const handleWhatsApp = () => {
    const text = `Olá, ${order.customer_name}! 📄 Aqui está o resumo do seu laudo técnico (OS ${order.id}).\n🛠️ *Serviço:* ${order.service_type}\n\n📝 *Laudo Técnico:*\n${reportText}\n\nAgradecemos a preferência! Qualquer dúvida, estamos à disposição.`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  const handleGeneratePDF = () => {
    window.print()
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6 pb-24 animate-fade-in">
      <div className="flex items-center gap-4 border-b pb-4 print:border-none print:pb-0">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="print:hidden">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Laudo Técnico e Entrega
            </h1>
            <p className="text-slate-500">
              OS: <span className="font-mono">{order.id}</span> - {order.customer_name}
            </p>
          </div>
          <Badge variant="outline" className="print:hidden capitalize">
            {order.status}
          </Badge>
        </div>
      </div>

      {!canSendWhatsApp && (
        <Alert variant="destructive" className="print:hidden">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Requisitos Pendentes para Envio</AlertTitle>
          <AlertDescription>
            Para enviar o laudo ao cliente, resolva as seguintes pendências:
            <ul className="list-disc pl-5 mt-2 space-y-1">
              {missingItems.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid md:grid-cols-2 gap-6 print:block print:space-y-6">
        <Card className="print:shadow-none print:border-slate-200 h-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-slate-800">
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
            {order.description && (
              <div>
                <span className="text-slate-500 block">Descrição Inicial</span>
                <p className="mt-1 text-slate-700 bg-slate-50 p-2 rounded border border-slate-100">
                  {order.description}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="print:shadow-none print:border-slate-200 h-full flex flex-col">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2 text-slate-800">
              <FileText className="w-5 h-5 text-slate-500" /> Laudo Técnico Final
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateAI}
              disabled={generating}
              className="print:hidden border-indigo-200 text-indigo-700 hover:bg-indigo-50"
            >
              <Wand2 className="w-4 h-4 mr-2" />
              {generating ? 'Gerando...' : 'Auto-Gerar'}
            </Button>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <Textarea
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              placeholder="Descreva o laudo técnico completo, condição do equipamento, atividades realizadas e recomendações..."
              className="flex-1 min-h-[150px] resize-y print:border-none print:resize-none print:p-0 print:min-h-0 print:bg-transparent"
            />
          </CardContent>
        </Card>
      </div>

      <Card className="print:shadow-none print:border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-slate-800">
            <Camera className="w-5 h-5 text-slate-500" /> Evidências Fotográficas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6 print:grid-cols-2 print:gap-4">
            <div>
              <h3 className="font-medium text-sm mb-3 text-slate-700">Fotos "Antes"</h3>
              {beforePhotos.length === 0 ? (
                <p className="text-sm text-slate-500 italic">Nenhuma foto registrada.</p>
              ) : (
                <div className="grid grid-cols-2 gap-2 print:grid-cols-2">
                  {beforePhotos.map((p) => (
                    <div
                      key={p.id}
                      className="relative aspect-square rounded-md overflow-hidden bg-slate-100 border"
                    >
                      <img
                        src={pb.files.getURL(p, p.file)}
                        alt="Antes"
                        className="object-cover w-full h-full"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <h3 className="font-medium text-sm mb-3 text-slate-700">Fotos "Depois"</h3>
              {afterPhotos.length === 0 ? (
                <p className="text-sm text-slate-500 italic">Nenhuma foto registrada.</p>
              ) : (
                <div className="grid grid-cols-2 gap-2 print:grid-cols-2">
                  {afterPhotos.map((p) => (
                    <div
                      key={p.id}
                      className="relative aspect-square rounded-md overflow-hidden bg-slate-100 border"
                    >
                      <img
                        src={pb.files.getURL(p, p.file)}
                        alt="Depois"
                        className="object-cover w-full h-full"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6 print:block print:space-y-6">
        <Card className="print:shadow-none print:border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-slate-800">
              <CheckCircle2 className="w-5 h-5 text-slate-500" /> Materiais Utilizados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {materialsList.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material / Peça</TableHead>
                    <TableHead className="text-right">Qtd</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materialsList.map((m, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        {m?.name ||
                          m?.description ||
                          (typeof m === 'string' ? m : JSON.stringify(m))}
                      </TableCell>
                      <TableCell className="text-right">{m?.quantity || m?.qtd || 1}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : rawMaterialsText ? (
              <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded border border-slate-100 whitespace-pre-wrap">
                {rawMaterialsText}
              </p>
            ) : (
              <p className="text-sm text-slate-500 italic">Nenhum material adicional registrado.</p>
            )}
          </CardContent>
        </Card>

        <Card className="print:shadow-none print:border-slate-200 break-inside-avoid">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-slate-800">
              <CheckCircle2 className="w-5 h-5 text-slate-500" /> Assinatura do Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center min-h-[150px]">
            {signatureUrl ? (
              <div className="max-w-xs border rounded-lg overflow-hidden bg-white p-4">
                <img
                  src={signatureUrl}
                  alt="Assinatura"
                  className="w-full h-auto mix-blend-multiply"
                />
                <p className="text-center text-xs text-slate-500 mt-2 border-t pt-2">
                  {order.customer_name}
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic text-center">
                Assinatura não coletada na tela de execução.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] flex items-center justify-between z-10 sm:static sm:bg-transparent sm:border-none sm:shadow-none sm:p-0 print:hidden">
        <div className="hidden sm:flex gap-2">
          <Button variant="outline" onClick={() => handleSave(false)} disabled={saving}>
            Salvar Rascunho
          </Button>
        </div>
        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <Button
            variant="outline"
            className="flex-shrink-0 border-slate-200 hover:bg-slate-50"
            onClick={handleGeneratePDF}
          >
            <Printer className="w-4 h-4 mr-2" /> PDF
          </Button>

          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex-shrink-0">
                <Button
                  variant="outline"
                  className={`w-full ${canSendWhatsApp ? 'text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200' : 'opacity-50 cursor-not-allowed'}`}
                  disabled={!canSendWhatsApp}
                  onClick={canSendWhatsApp ? handleWhatsApp : undefined}
                >
                  <Send className="w-4 h-4 mr-2" /> WhatsApp
                </Button>
              </span>
            </TooltipTrigger>
            {!canSendWhatsApp && (
              <TooltipContent side="top">
                <p className="text-xs">Requisitos pendentes!</p>
              </TooltipContent>
            )}
          </Tooltip>

          <Button
            variant="outline"
            className="flex-shrink-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
            onClick={handlePayment}
          >
            <CreditCard className="w-4 h-4 mr-2" /> Faturar
          </Button>
          <Button
            className="flex-shrink-0 ml-auto sm:ml-0 bg-slate-900 text-white hover:bg-slate-800"
            onClick={() => handleSave(true)}
            disabled={saving}
          >
            <CheckCircle2 className="w-4 h-4 mr-2" /> Entregar
          </Button>
        </div>
      </div>
    </div>
  )
}
