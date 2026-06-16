import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ArrowLeft,
  MapPin,
  Phone,
  User,
  Play,
  Pause,
  CheckCircle2,
  Navigation,
  Camera,
  Trash2,
  PenTool,
} from 'lucide-react'
import {
  getOSChecklist,
  toggleChecklistItem,
  getOSPhotos,
  uploadOSPhoto,
  deleteOSPhoto,
  updateOSStatus,
  uploadSignature,
} from '@/services/technician'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import pb from '@/lib/pocketbase/client'
import { SignaturePad } from '@/components/SignaturePad'

interface Props {
  os: any
  onBack: () => void
}

export function OSExecutionView({ os, onBack }: Props) {
  const [activeTab, setActiveTab] = useState('resumo')
  const [checklist, setChecklist] = useState<any[]>([])
  const [photos, setPhotos] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const isCompleted = os.status === 'concluído'

  useEffect(() => {
    loadDocs()
  }, [os.id])

  const loadDocs = async () => {
    try {
      const [chk, phts] = await Promise.all([getOSChecklist(os.id), getOSPhotos(os.id)])
      setChecklist(chk)
      setPhotos(phts)
    } catch (err) {
      console.error(err)
    }
  }

  const handleAction = async (action: 'en_route' | 'start' | 'pause' | 'complete') => {
    setLoading(true)
    try {
      let data: any = {}
      const now = new Date().toISOString()

      switch (action) {
        case 'en_route':
          data = { operational_status: 'en_route', status: 'executando' }
          break
        case 'start':
          data = {
            operational_status: 'in_progress',
            status: 'executando',
            ...(os.started_at ? {} : { started_at: now }),
          }
          break
        case 'pause':
          data = { operational_status: 'paused', last_paused_at: now }
          break
        case 'complete':
          data = { operational_status: 'completed', status: 'concluído', finished_at: now }
          break
      }

      await updateOSStatus(os.id, data)
      toast.success('Status atualizado com sucesso')
      if (action === 'complete') onBack()
    } catch (error) {
      toast.error('Erro ao atualizar status')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleChecklist = async (id: string, completed: boolean) => {
    if (isCompleted) return
    try {
      setChecklist((prev) => prev.map((c) => (c.id === id ? { ...c, is_completed: completed } : c)))
      await toggleChecklistItem(id, completed)
    } catch (err) {
      toast.error('Erro ao atualizar checklist')
      loadDocs() // revert
    }
  }

  const handleUploadPhoto = async (
    e: React.ChangeEvent<HTMLInputElement>,
    stage: 'before' | 'after',
  ) => {
    if (!e.target.files || e.target.files.length === 0) return
    const file = e.target.files[0]
    try {
      toast.info('Enviando foto...')
      await uploadOSPhoto(os.id, file, stage)
      toast.success('Foto enviada!')
      loadDocs()
    } catch (err) {
      toast.error('Erro ao enviar foto')
    }
  }

  const handleDeletePhoto = async (id: string) => {
    try {
      await deleteOSPhoto(id)
      loadDocs()
    } catch (err) {
      toast.error('Erro ao excluir foto')
    }
  }

  const handleSaveSignature = async (file: File) => {
    try {
      toast.info('Salvando assinatura...')
      await uploadSignature(os.id, file)
      toast.success('Assinatura salva!')
      os.signature = 'saved'
    } catch (err) {
      toast.error('Erro ao salvar assinatura')
    }
  }

  const photosBefore = photos.filter((p) => p.stage === 'before')
  const photosAfter = photos.filter((p) => p.stage === 'after')

  const getPhotoUrl = (record: any) => {
    return pb.files.getURL(record, record.file)
  }

  return (
    <div className="flex flex-col h-full bg-white max-w-md mx-auto md:border-x min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-primary text-primary-foreground sticky top-0 z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="text-primary-foreground hover:bg-primary/90"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h2 className="font-semibold text-lg leading-tight">
            OS #{os.id.slice(0, 6).toUpperCase()}
          </h2>
          <p className="text-xs text-primary-foreground/80 truncate">
            {os.customer_name || os.expand?.customer?.name}
          </p>
        </div>
        <Badge variant="secondary" className="bg-white/20 text-white border-0 pointer-events-none">
          {os.operational_status || 'Pendente'}
        </Badge>
      </div>

      <div className="flex-1 overflow-y-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-4 pt-4 border-b">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="resumo">Resumo</TabsTrigger>
              <TabsTrigger value="checklist">Checklist</TabsTrigger>
              <TabsTrigger value="fotos">Docs</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="resumo" className="p-4 mt-0 space-y-6">
            <section>
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-slate-500" />
                Dados do Cliente
              </h3>
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <User className="w-4 h-4 text-slate-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {os.customer_name || os.expand?.customer?.name}
                      </p>
                    </div>
                  </div>
                  {os.expand?.customer?.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <p className="text-sm">{os.expand.customer.phone}</p>
                    </div>
                  )}
                  {os.expand?.customer?.address && (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                      <p className="text-sm flex-1">{os.expand.customer.address}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>

            <section>
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <PenTool className="w-4 h-4 text-slate-500" />
                Detalhes do Serviço
              </h3>
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div>
                    <Label className="text-xs text-slate-500 mb-1 block">Tipo de Serviço</Label>
                    <p className="text-sm font-medium">{os.service_type}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500 mb-1 block">Data Agendada</Label>
                    <p className="text-sm font-medium">
                      {os.scheduled_date
                        ? format(parseISO(os.scheduled_date), "dd/MM/yyyy 'às' HH:mm", {
                            locale: ptBR,
                          })
                        : 'Não agendado'}
                    </p>
                  </div>
                  {os.description && (
                    <div>
                      <Label className="text-xs text-slate-500 mb-1 block">
                        Descrição / Problema
                      </Label>
                      <p className="text-sm bg-slate-50 p-2 rounded border whitespace-pre-wrap">
                        {os.description}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>
          </TabsContent>

          <TabsContent value="checklist" className="p-4 mt-0 space-y-4">
            <h3 className="font-semibold text-slate-900 mb-2">Tarefas da Execução</h3>
            {checklist.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">Nenhum item no checklist.</p>
            ) : (
              <Card>
                <CardContent className="p-0 divide-y">
                  {checklist.map((item) => (
                    <div key={item.id} className="p-4 flex items-start gap-3 hover:bg-slate-50">
                      <Checkbox
                        id={item.id}
                        checked={item.is_completed}
                        disabled={isCompleted}
                        onCheckedChange={(checked) =>
                          handleToggleChecklist(item.id, checked as boolean)
                        }
                        className="mt-0.5"
                      />
                      <Label
                        htmlFor={item.id}
                        className="text-sm leading-relaxed flex-1 cursor-pointer font-normal"
                      >
                        {item.task_description}
                      </Label>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="fotos" className="p-4 mt-0 space-y-6">
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-900">Fotos Antes do Serviço</h3>
                {!isCompleted && (
                  <Label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition-colors">
                    <Camera className="w-3.5 h-3.5" /> Adicionar
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => handleUploadPhoto(e, 'before')}
                    />
                  </Label>
                )}
              </div>
              {photosBefore.length === 0 ? (
                <div className="text-center py-6 bg-slate-50 rounded-lg border border-dashed border-slate-200 text-slate-400 text-sm">
                  Nenhuma foto adicionada
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {photosBefore.map((p) => (
                    <div
                      key={p.id}
                      className="relative aspect-square rounded-md overflow-hidden group border bg-slate-100"
                    >
                      <img
                        src={getPhotoUrl(p)}
                        alt="Antes"
                        className="w-full h-full object-cover"
                      />
                      {!isCompleted && (
                        <button
                          onClick={() => handleDeletePhoto(p.id)}
                          className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-900">Fotos Depois do Serviço</h3>
                {!isCompleted && (
                  <Label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition-colors">
                    <Camera className="w-3.5 h-3.5" /> Adicionar
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => handleUploadPhoto(e, 'after')}
                    />
                  </Label>
                )}
              </div>
              {photosAfter.length === 0 ? (
                <div className="text-center py-6 bg-slate-50 rounded-lg border border-dashed border-slate-200 text-slate-400 text-sm">
                  Nenhuma foto adicionada
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {photosAfter.map((p) => (
                    <div
                      key={p.id}
                      className="relative aspect-square rounded-md overflow-hidden group border bg-slate-100"
                    >
                      <img
                        src={getPhotoUrl(p)}
                        alt="Depois"
                        className="w-full h-full object-cover"
                      />
                      {!isCompleted && (
                        <button
                          onClick={() => handleDeletePhoto(p.id)}
                          className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h3 className="font-semibold text-slate-900 mb-3">Assinatura do Cliente</h3>
              {os.signature ? (
                <Card>
                  <CardContent className="p-4 flex flex-col items-center justify-center bg-slate-50">
                    <div className="w-full h-32 flex items-center justify-center">
                      <img
                        src={
                          os.signature === 'saved'
                            ? '/placeholder.svg'
                            : pb.files.getURL(os, os.signature)
                        }
                        alt="Assinatura"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-2">Assinatura coletada</p>
                  </CardContent>
                </Card>
              ) : isCompleted ? (
                <p className="text-sm text-slate-500">Nenhuma assinatura coletada.</p>
              ) : (
                <SignaturePad onSave={handleSaveSignature} />
              )}
            </section>
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer Workflow Actions */}
      {!isCompleted && (
        <div className="p-4 bg-white border-t flex flex-wrap gap-2 sticky bottom-0 z-10 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
          {(!os.operational_status || os.operational_status === 'pending') && (
            <>
              <Button
                className="flex-1"
                variant="outline"
                onClick={() => handleAction('en_route')}
                disabled={loading}
              >
                <Navigation className="w-4 h-4 mr-2" /> A Caminho
              </Button>
              <Button className="flex-1" onClick={() => handleAction('start')} disabled={loading}>
                <Play className="w-4 h-4 mr-2" /> Iniciar
              </Button>
            </>
          )}

          {os.operational_status === 'en_route' && (
            <Button className="w-full" onClick={() => handleAction('start')} disabled={loading}>
              <Play className="w-4 h-4 mr-2" /> Cheguei / Iniciar
            </Button>
          )}

          {os.operational_status === 'in_progress' && (
            <>
              <Button
                className="flex-1"
                variant="outline"
                onClick={() => handleAction('pause')}
                disabled={loading}
              >
                <Pause className="w-4 h-4 mr-2" /> Pausar
              </Button>
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                onClick={() => handleAction('complete')}
                disabled={loading}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" /> Concluir
              </Button>
            </>
          )}

          {os.operational_status === 'paused' && (
            <Button className="w-full" onClick={() => handleAction('start')} disabled={loading}>
              <Play className="w-4 h-4 mr-2" /> Retomar
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
