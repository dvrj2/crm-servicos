import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CheckCircle2, PlayCircle } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { ServiceOrder, AutomationLog } from '@/types'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  createSimulatedOS,
  simulateQuoteApproval,
  updateOperationalStatus,
  simulateChecklist,
  uploadExecutionPhotos,
  finalizeSimulation,
  confirmPayment,
  uploadInitialPhotos,
} from '@/services/simulator'

const steps = [
  { id: 1, title: 'Contato Inicial', description: 'Simular mensagem WhatsApp' },
  { id: 2, title: 'Fotos Iniciais', description: 'Upload de fotos do problema' },
  { id: 3, title: 'Aprovação', description: 'Aceite do orçamento' },
  { id: 4, title: 'Execução', description: 'Ações do técnico em campo' },
  { id: 5, title: 'Faturamento', description: 'Geração de relatório e cobrança' },
  { id: 6, title: 'Pagamento', description: 'Confirmação via Webhook' },
]

export default function Simulator() {
  const [activeStep, setActiveStep] = useState(1)
  const [osId, setOsId] = useState<string | null>(null)
  const [os, setOs] = useState<ServiceOrder | null>(null)
  const [logs, setLogs] = useState<AutomationLog[]>([])
  const [execStatus, setExecStatus] = useState(0) // 0: pending, 1: en route, 2: in progress, 3: checklist done

  const [message, setMessage] = useState(
    'Minha máquina de lavar parou de funcionar e está vazando água. Preciso de ajuda urgente!',
  )

  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (osId) {
      pb.collection('service_orders')
        .getOne(osId)
        .then((data) => setOs(data as ServiceOrder))
      pb.collection('automation_logs')
        .getFullList({ filter: `service_order = "${osId}"`, sort: 'created' })
        .then((data) => setLogs(data as AutomationLog[]))
    }
  }, [osId])

  useRealtime<ServiceOrder>('service_orders', (e) => {
    if (e.action === 'update' && e.record.id === osId) {
      setOs(e.record)
    }
  })

  useRealtime<AutomationLog>('automation_logs', (e) => {
    if (e.record.service_order === osId || e.record.details?.os_id === osId) {
      if (e.action === 'create') {
        setLogs((prev) => [...prev, e.record])
      }
    }
  })

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const handleCreateOs = async () => {
    try {
      const newOs = await createSimulatedOS(message)
      setOsId(newOs.id)
      setOs(newOs)
      setActiveStep(2)
      toast.success('Mensagem simulada com sucesso')
    } catch (e) {
      toast.error('Erro ao simular mensagem')
    }
  }

  const handlePhotosMock = async () => {
    const mockFiles = [
      new File([''], 'foto1.jpg', { type: 'image/jpeg' }),
      new File([''], 'foto2.jpg', { type: 'image/jpeg' }),
      new File([''], 'foto3.jpg', { type: 'image/jpeg' }),
    ]
    await uploadInitialPhotos(osId!, mockFiles)
    setActiveStep(3)
    toast.success('Fotos mockadas enviadas com sucesso')
  }

  const handleApprove = async () => {
    await simulateQuoteApproval(osId!)
    setActiveStep(4)
    toast.success('Orçamento aprovado simulado')
  }

  const handleEnRoute = async () => {
    await updateOperationalStatus(osId!, 'en_route', 'a_caminho')
    setExecStatus(1)
  }

  const handleInProgress = async () => {
    await updateOperationalStatus(osId!, 'in_progress', 'em_execucao')
    setExecStatus(2)
  }

  const handleChecklist = async () => {
    await simulateChecklist(osId!)
    const mockFiles = [new File([''], 'after.jpg', { type: 'image/jpeg' })]
    await uploadExecutionPhotos(osId!, mockFiles)
    setExecStatus(3)
    setActiveStep(5)
    toast.success('Checklist e execução finalizados')
  }

  const handleFinalize = async () => {
    await finalizeSimulation(osId!)
    setActiveStep(6)
    toast.success('Faturamento e relatório gerados')
  }

  const handlePayment = async () => {
    await confirmPayment(osId!)
    setActiveStep(7)
    toast.success('Pagamento confirmado via webhook simulado')
  }

  const handleReset = () => {
    setOsId(null)
    setOs(null)
    setActiveStep(1)
    setLogs([])
    setExecStatus(0)
    setMessage(
      'Minha máquina de lavar parou de funcionar e está vazando água. Preciso de ajuda urgente!',
    )
  }

  return (
    <div className="flex-1 space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Simulador de Fluxo (E2E)</h2>
          <p className="text-slate-500">
            Valide as automações do ciclo de vida da Ordem de Serviço passo a passo.
          </p>
        </div>
        {osId && (
          <Button variant="outline" onClick={handleReset}>
            Iniciar Nova Simulação
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Painel de Controle</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                {steps.map((step) => {
                  const isActive = activeStep === step.id
                  const isCompleted = activeStep > step.id
                  return (
                    <div
                      key={step.id}
                      className={cn(
                        'border rounded-lg p-4 transition-all duration-300',
                        isActive ? 'border-primary bg-primary/5' : 'bg-white',
                        isCompleted ? 'opacity-70' : '',
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {isCompleted ? (
                          <CheckCircle2 className="w-6 h-6 text-green-500" />
                        ) : (
                          <div
                            className={cn(
                              'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                              isActive ? 'bg-primary text-white' : 'bg-slate-200 text-slate-500',
                            )}
                          >
                            {step.id}
                          </div>
                        )}
                        <div>
                          <h3 className={cn('font-semibold', isActive ? 'text-primary' : '')}>
                            {step.title}
                          </h3>
                          <p className="text-sm text-slate-500">{step.description}</p>
                        </div>
                      </div>

                      {isActive && (
                        <div className="mt-4 pl-9 animate-fade-in-down">
                          {step.id === 1 && (
                            <div className="space-y-3">
                              <Label>Mensagem do Cliente</Label>
                              <Textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={3}
                              />
                              <Button onClick={handleCreateOs} className="w-full sm:w-auto">
                                <PlayCircle className="w-4 h-4 mr-2" />
                                Simular Recebimento
                              </Button>
                            </div>
                          )}

                          {step.id === 2 && (
                            <div className="space-y-3">
                              <p className="text-sm text-slate-600">
                                O fluxo aguarda as fotos iniciais para complementar o diagnóstico.
                              </p>
                              <Button onClick={handlePhotosMock} className="w-full sm:w-auto">
                                Gerar 3 Fotos Mockadas
                              </Button>
                            </div>
                          )}

                          {step.id === 3 && (
                            <div className="space-y-3">
                              <p className="text-sm text-slate-600">
                                O cliente recebeu o orçamento e respondeu "Sim".
                              </p>
                              <Button onClick={handleApprove} className="w-full sm:w-auto">
                                Simular Aprovação
                              </Button>
                            </div>
                          )}

                          {step.id === 4 && (
                            <div className="flex flex-col sm:flex-row gap-3">
                              <Button
                                variant={execStatus >= 1 ? 'secondary' : 'default'}
                                disabled={execStatus >= 1}
                                onClick={handleEnRoute}
                              >
                                1. Técnico a Caminho
                              </Button>
                              <Button
                                variant={execStatus >= 2 ? 'secondary' : 'default'}
                                disabled={execStatus >= 2 || execStatus < 1}
                                onClick={handleInProgress}
                              >
                                2. Iniciar Atendimento
                              </Button>
                              <Button
                                variant={execStatus >= 3 ? 'secondary' : 'default'}
                                disabled={execStatus >= 3 || execStatus < 2}
                                onClick={handleChecklist}
                              >
                                3. Preencher Checklist
                              </Button>
                            </div>
                          )}

                          {step.id === 5 && (
                            <div className="space-y-3">
                              <p className="text-sm text-slate-600">
                                O sistema irá gerar o relatório técnico e criar a cobrança
                                (Faturamento).
                              </p>
                              <Button onClick={handleFinalize} className="w-full sm:w-auto">
                                Gerar Relatório e Faturamento
                              </Button>
                            </div>
                          )}

                          {step.id === 6 && (
                            <div className="space-y-3">
                              <p className="text-sm text-slate-600">
                                Simula o webhook da operadora de cartão confirmando o pagamento.
                              </p>
                              <Button onClick={handlePayment} className="w-full sm:w-auto">
                                Confirmar Pagamento (Webhook)
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}

                {activeStep === 7 && (
                  <div className="mt-6 p-6 border border-green-200 bg-green-50 rounded-lg text-center animate-fade-in-up">
                    <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-2" />
                    <h3 className="text-lg font-bold text-green-800">
                      Fluxo Concluído com Sucesso!
                    </h3>
                    <p className="text-sm text-green-700 mt-1">
                      A Ordem de Serviço passou por todas as etapas do ciclo de vida simulado.
                    </p>
                    <Button className="mt-4" variant="outline" onClick={handleReset}>
                      Nova Simulação
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                Dados da OS
                {os?.id && (
                  <span className="text-xs text-slate-400 font-normal">#{os.id.slice(0, 8)}</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!os ? (
                <p className="text-sm text-slate-500 italic">Nenhuma OS em simulação.</p>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-y-3 text-sm">
                    <div className="text-slate-500">Status:</div>
                    <div>
                      <Badge>{os.status}</Badge>
                    </div>

                    <div className="text-slate-500">Urgência:</div>
                    <div>
                      <Badge variant="outline" className="uppercase">
                        {os.urgency}
                      </Badge>
                    </div>

                    <div className="text-slate-500">Pagamento:</div>
                    <div>
                      <Badge
                        variant={os.payment_status === 'pago' ? 'default' : 'secondary'}
                        className="uppercase"
                      >
                        {os.payment_status}
                      </Badge>
                    </div>

                    <div className="text-slate-500">Status Oper.:</div>
                    <div className="capitalize font-medium text-primary">
                      {os.operational_status || 'N/A'}
                    </div>
                  </div>

                  <Separator />
                  <div className="text-sm">
                    <span className="text-slate-500 block mb-1">Descrição Original:</span>
                    <p className="text-slate-800 bg-slate-50 p-2 rounded text-xs line-clamp-4">
                      {os.description}
                    </p>
                  </div>

                  {(os.technical_report || os.payment_link) && (
                    <div className="space-y-2 mt-4 pt-4 border-t">
                      <h4 className="font-semibold text-sm">Documentos Gerados</h4>
                      {os.payment_link && (
                        <a
                          href={os.payment_link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-blue-600 bg-blue-50 p-2 rounded block break-all hover:underline"
                        >
                          💳 {os.payment_link}
                        </a>
                      )}
                      {os.technical_report && (
                        <div className="text-xs text-slate-700 bg-slate-50 p-2 rounded max-h-32 overflow-y-auto whitespace-pre-wrap border border-slate-100">
                          📄 {os.technical_report}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                Logs em Tempo Real
                {logs.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {logs.length} logs
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64 pr-4">
                <div className="space-y-3">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="text-sm border-l-2 border-primary pl-3 py-1 animate-fade-in"
                    >
                      <div className="font-semibold text-slate-800">{log.action_taken}</div>
                      <div className="text-slate-500 text-xs mt-0.5">
                        {new Date(log.created).toLocaleTimeString()} • {log.result}
                      </div>
                    </div>
                  ))}
                  {logs.length === 0 && (
                    <p className="text-sm text-slate-500 italic">Nenhum log registrado ainda.</p>
                  )}
                  <div ref={bottomRef} />
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
