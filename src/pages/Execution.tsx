import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { getServiceOrder } from '@/services/api'
import {
  getOrderPhotos,
  getChecklistItems,
  uploadPhoto,
  deletePhoto,
  updateChecklistItem,
  updateExecutionOrder,
  updateUserLocation,
} from '@/services/execution'
import { ServiceOrder, ServiceOrderPhoto, ServiceOrderChecklistItem } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { SignaturePad } from '@/components/SignaturePad'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import {
  ArrowLeft,
  MapPin,
  Play,
  Pause,
  CheckSquare,
  Camera,
  FileCheck,
  Trash2,
} from 'lucide-react'
import pb from '@/lib/pocketbase/client'

export default function Execution() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [order, setOrder] = useState<ServiceOrder | null>(null)
  const [photos, setPhotos] = useState<ServiceOrderPhoto[]>([])
  const [checklists, setChecklists] = useState<ServiceOrderChecklistItem[]>([])

  const [reworkDialogOpen, setReworkDialogOpen] = useState(false)
  const [materials, setMaterials] = useState('')
  const [observations, setObservations] = useState('')

  const beforeInputRef = useRef<HTMLInputElement>(null)
  const afterInputRef = useRef<HTMLInputElement>(null)

  const loadData = async () => {
    if (!id) return
    try {
      const o = await getServiceOrder(id)
      setOrder(o)
      setMaterials(o.materials_used || '')
      setObservations(o.technical_observations || '')

      const [p, c] = await Promise.all([getOrderPhotos(id), getChecklistItems(id)])
      setPhotos(p)
      setChecklists(c)
    } catch (e) {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar a OS',
        variant: 'destructive',
      })
    }
  }

  useEffect(() => {
    loadData()
  }, [id])

  const captureLocation = () => {
    if (navigator.geolocation && user?.id) {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          updateUserLocation(user.id, pos.coords.latitude, pos.coords.longitude).catch(() => {}),
        () => console.warn('GPS não disponível'),
      )
    }
  }

  const handleEnRoute = async () => {
    if (!order) return
    captureLocation()
    await updateExecutionOrder(order.id, { operational_status: 'en_route' })
    if (user?.id) await pb.collection('users').update(user.id, { operational_status: 'en_route' })
    loadData()
  }

  const beforePhotos = photos.filter((p) => p.stage === 'before')
  const afterPhotos = photos.filter((p) => p.stage === 'after')

  const handleStartRequest = () => {
    if (beforePhotos.length === 0) {
      toast({
        title: 'Atenção',
        description: 'É necessário pelo menos uma foto do "Antes" para iniciar.',
        variant: 'destructive',
      })
      return
    }
    setReworkDialogOpen(true)
  }

  const handleStart = async (isRework: boolean) => {
    if (!order) return
    setReworkDialogOpen(false)
    captureLocation()
    await updateExecutionOrder(order.id, {
      operational_status: 'in_progress',
      status: 'execucao',
      started_at: new Date().toISOString(),
      is_rework: isRework,
    })
    if (user?.id) await pb.collection('users').update(user.id, { operational_status: 'busy' })
    loadData()
  }

  const handlePause = async () => {
    if (!order) return
    await updateExecutionOrder(order.id, {
      operational_status: 'paused',
      last_paused_at: new Date().toISOString(),
    })
    loadData()
  }

  const handleResume = async () => {
    if (!order || !order.last_paused_at) return
    const pausedAt = new Date(order.last_paused_at).getTime()
    const now = new Date().getTime()
    const pauseMins = Math.round((now - pausedAt) / 60000)
    const total = (order.total_pause_time_minutes || 0) + pauseMins

    await updateExecutionOrder(order.id, {
      operational_status: 'in_progress',
      total_pause_time_minutes: total,
      last_paused_at: null,
    })
    loadData()
  }

  const allChecklistsDone = checklists.length > 0 && checklists.every((c) => c.is_completed)
  const canFinish = allChecklistsDone && afterPhotos.length > 0 && !!order?.signature

  const handleFinish = async () => {
    if (!order || !order.started_at) return
    if (!canFinish) return

    const startedAt = new Date(order.started_at).getTime()
    const now = new Date().getTime()
    const pauseMins = order.total_pause_time_minutes || 0
    const durationHours = (now - startedAt - pauseMins * 60000) / 3600000

    await updateExecutionOrder(order.id, {
      operational_status: 'completed',
      status: 'concluido',
      finished_at: new Date().toISOString(),
      materials_used: materials,
      technical_observations: observations,
      actual_duration_hours: durationHours,
    })
    if (user?.id) await pb.collection('users').update(user.id, { operational_status: 'available' })
    toast({ title: 'Sucesso', description: 'Serviço concluído com sucesso.' })
    navigate('/')
  }

  const handleDocsUpdate = async () => {
    if (!order) return
    await updateExecutionOrder(order.id, {
      materials_used: materials,
      technical_observations: observations,
    })
    toast({ title: 'Salvo', description: 'Anotações salvas.' })
  }

  const handlePhotoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    stage: 'before' | 'after',
  ) => {
    if (!order || !e.target.files || e.target.files.length === 0) return
    try {
      await uploadPhoto(order.id, e.target.files[0], stage)
      loadData()
    } catch {
      toast({ title: 'Erro', description: 'Falha ao enviar foto.', variant: 'destructive' })
    }
  }

  const handleSignatureSave = async (file: File) => {
    if (!order) return
    const fd = new FormData()
    fd.append('signature', file)
    try {
      await updateExecutionOrder(order.id, fd)
      toast({ title: 'Assinatura', description: 'Assinatura salva.' })
      loadData()
    } catch {
      toast({ title: 'Erro', description: 'Falha ao salvar assinatura.', variant: 'destructive' })
    }
  }

  if (!order)
    return <div className="p-8 text-center text-slate-500">Carregando execução da OS...</div>

  const opStatus = order.operational_status || 'pending'

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6 pb-24 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mr-2">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold flex-1 truncate">Execução: {order.customer_name}</h1>
        <Badge
          variant={opStatus === 'completed' ? 'default' : 'secondary'}
          className="ml-2 capitalize"
        >
          {opStatus.replace('_', ' ')}
        </Badge>
      </div>

      <Card className="sticky top-4 z-10 shadow-sm border-blue-100 bg-blue-50/50">
        <CardContent className="p-4 flex gap-2 flex-wrap">
          {opStatus === 'pending' && (
            <Button className="w-full" onClick={handleEnRoute}>
              <MapPin className="w-4 h-4 mr-2" /> A Caminho
            </Button>
          )}
          {opStatus === 'en_route' && (
            <Button className="w-full" onClick={handleStartRequest}>
              <Play className="w-4 h-4 mr-2" /> Iniciar Serviço
            </Button>
          )}
          {opStatus === 'in_progress' && (
            <>
              <Button variant="secondary" className="flex-1" onClick={handlePause}>
                <Pause className="w-4 h-4 mr-2" /> Pausar
              </Button>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50"
                onClick={handleFinish}
                disabled={!canFinish}
              >
                <CheckSquare className="w-4 h-4 mr-2" /> Concluir
              </Button>
            </>
          )}
          {opStatus === 'paused' && (
            <Button className="w-full" onClick={handleResume}>
              <Play className="w-4 h-4 mr-2" /> Retomar Serviço
            </Button>
          )}
          {opStatus === 'completed' && (
            <div className="text-center w-full text-green-700 font-medium py-2">
              Serviço Concluído
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={reworkDialogOpen} onOpenChange={setReworkDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmação de Início</DialogTitle>
            <DialogDescription>
              Este atendimento é considerado um retrabalho de um serviço anterior?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
            <Button variant="outline" onClick={() => handleStart(false)} className="flex-1">
              Não, serviço normal
            </Button>
            <Button variant="destructive" onClick={() => handleStart(true)} className="flex-1">
              Sim, é retrabalho
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader className="py-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-blue-600" />
            Checklist Obrigatório
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {checklists.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum item de checklist cadastrado.</p>
          ) : (
            checklists.map((item) => (
              <div key={item.id} className="flex items-start space-x-3">
                <Checkbox
                  id={item.id}
                  checked={item.is_completed}
                  disabled={opStatus === 'completed'}
                  onCheckedChange={async (c) => {
                    await updateChecklistItem(item.id, !!c)
                    loadData()
                  }}
                />
                <label
                  htmlFor={item.id}
                  className={`text-sm leading-tight peer-disabled:cursor-not-allowed select-none transition-colors ${item.is_completed ? 'line-through text-slate-400' : 'text-slate-700'}`}
                >
                  {item.task_description}
                </label>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-sm">
              Fotos "Antes" {beforePhotos.length === 0 && <span className="text-red-500">*</span>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              {beforePhotos.map((p) => (
                <div
                  key={p.id}
                  className="relative group w-20 h-20 rounded-md overflow-hidden border shadow-sm"
                >
                  <img
                    src={pb.files.getURL(p, p.file)}
                    alt="Before"
                    className="w-full h-full object-cover"
                  />
                  {opStatus !== 'completed' && (
                    <button
                      onClick={async () => {
                        await deletePhoto(p.id)
                        loadData()
                      }}
                      className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {opStatus !== 'completed' && (
              <div>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  ref={beforeInputRef}
                  onChange={(e) => handlePhotoUpload(e, 'before')}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-dashed"
                  onClick={() => beforeInputRef.current?.click()}
                >
                  <Camera className="w-4 h-4 mr-2" /> Capturar
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-sm">
              Fotos "Depois" {afterPhotos.length === 0 && <span className="text-red-500">*</span>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              {afterPhotos.map((p) => (
                <div
                  key={p.id}
                  className="relative group w-20 h-20 rounded-md overflow-hidden border shadow-sm"
                >
                  <img
                    src={pb.files.getURL(p, p.file)}
                    alt="After"
                    className="w-full h-full object-cover"
                  />
                  {opStatus !== 'completed' && (
                    <button
                      onClick={async () => {
                        await deletePhoto(p.id)
                        loadData()
                      }}
                      className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {opStatus !== 'completed' && (
              <div>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  ref={afterInputRef}
                  onChange={(e) => handlePhotoUpload(e, 'after')}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-dashed"
                  onClick={() => afterInputRef.current?.click()}
                >
                  <Camera className="w-4 h-4 mr-2" /> Capturar
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="py-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-blue-600" />
            Documentação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Materiais Utilizados</label>
            <Textarea
              value={materials}
              onChange={(e) => setMaterials(e.target.value)}
              onBlur={handleDocsUpdate}
              placeholder="Descreva os materiais utilizados..."
              disabled={opStatus === 'completed'}
              className="resize-none h-20 bg-slate-50"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Observações Técnicas</label>
            <Textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              onBlur={handleDocsUpdate}
              placeholder="Descreva observações adicionais..."
              disabled={opStatus === 'completed'}
              className="resize-none h-20 bg-slate-50"
            />
          </div>

          <div className="pt-4 border-t space-y-3">
            <label className="text-sm font-medium text-slate-700">
              Assinatura do Cliente {!order.signature && <span className="text-red-500">*</span>}
            </label>
            {order.signature ? (
              <div className="border border-slate-200 rounded-md p-4 bg-slate-50 flex flex-col items-center">
                <img
                  src={pb.files.getURL(order, order.signature)}
                  alt="Assinatura"
                  className="max-h-24 object-contain mix-blend-multiply"
                />
                {opStatus !== 'completed' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 mt-2"
                    onClick={async () => {
                      await updateExecutionOrder(order.id, { signature: null })
                      loadData()
                    }}
                  >
                    Refazer Assinatura
                  </Button>
                )}
              </div>
            ) : opStatus !== 'completed' ? (
              <SignaturePad onSave={handleSignatureSave} onClear={() => {}} />
            ) : (
              <p className="text-sm text-muted-foreground">Sem assinatura providenciada.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
