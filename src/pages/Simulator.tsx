import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CheckCircle2, PlayCircle, AlertCircle } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { ServiceOrder, AutomationLog } from '@/types'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import {
  createSimulatedOS,
  simulateQuoteApproval,
  updateOperationalStatus,
  simulateChecklist,
  uploadExecutionPhotos,
  finalizeSimulation,
  confirmPayment,
  uploadInitialPhotos,
  simulateBulkAssignment,
  createMockImageFile,
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
  const [execStatus, setExecStatus] = useState(0)
  const [runningBulk, setRunningBulk] = useState(false)
  const [bulkResults, setBulkResults] = useState<any[]>([])

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
    } catch (e: any) {
      toast.error('Erro ao simular mensagem', {
        description: getErrorMessage(e),
      })
    }
  }

  const handlePhotosMock = async (url?: string) => {
    try {
      let files: File[] = []
      if (url) {
        toast.info('Baixando imagem simulada...')
        const res = await fetch(url)
        const blob = await res.blob()
        files = [new File([blob], 'foto.jpg', { type: 'image/jpeg' })]
      } else {
        files = [
          createMockImageFile('foto1.png'),
          createMockImageFile('foto2.png'),
          createMockImageFile('foto3.png'),
        ]
      }
      await uploadInitialPhotos(osId!, files)
      setActiveStep(3)
      toast.success('Fotos simuladas enviadas com sucesso')
    } catch (e: any) {
      toast.error('Erro ao simular foto', {
        description: getErrorMessage(e),
      })
    }
  }

  const handleApprove = async () => {
    try {
      await simulateQuoteApproval(osId!)
      setActiveStep(4)
      toast.success('Orçamento aprovado simulado')
    } catch (e: any) {
      toast.error('Erro ao aprovar orçamento', {
        description: getErrorMessage(e),
      })
    }
  }

  const handleEnRoute = async () => {
    try {
      await updateOperationalStatus(osId!, 'en_route', 'a_caminho')
      setExecStatus(1)
    } catch (e: any) {
      toast.error('Erro ao atualizar status', {
        description: getErrorMessage(e),
      })
    }
  }

  const handleInProgress = async () => {
    try {
      await updateOperationalStatus(osId!, 'in_progress', 'em_execucao')
      setExecStatus(2)
    } catch (e: any) {
      toast.error('Erro ao atualizar status', {
        description: getErrorMessage(e),
      })
    }
  }

  const handleChecklist = async () => {
    try {
      await simulateChecklist(osId!)
      const mockFiles = [createMockImageFile('after.png')]
      await uploadExecutionPhotos(osId!, mockFiles)
      setExecStatus(3)
      setActiveStep(5)
      toast.success('Checklist e execução finalizados')
    } catch (e: any) {
      toast.error('Erro ao finalizar checklist', {
        description: getErrorMessage(e),
      })
    }
  }

  const handleFinalize = async () => {
    try {
      await finalizeSimulation(osId!)
      setActiveStep(6)
      toast.success('Faturamento e relatório gerados')
    } catch (e: any) {
      toast.error('Erro ao gerar faturamento', {
        description: getErrorMessage(e),
      })
    }
  }

  const handlePayment = async () => {
    try {
      await confirmPayment(osId!)
      setActiveStep(7)
      toast.success('Pagamento confirmado via webhook simulado')
    } catch (e: any) {
      toast.error('Erro ao confirmar pagamento', {
        description: getErrorMessage(e),
      })
    }
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

  const handleBulkSimulate = async () => {
    setRunningBulk(true)
    setBulkResults([])
    try {
      const res = await simulateBulkAssignment()
      setBulkResults(res.results)
      toast.success('Simulação em massa concluída!')
    } catch (e: any) {
      toast.error('Erro na simulação', {
        description: getErrorMessage(e),
      })
    } finally {
      setRunningBulk(false)
    }
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

      <Tabs defaultValue="e2e" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="e2e">Ciclo de Vida E2E</TabsTrigger>
          <TabsTrigger value="bulk">Distribuição em Massa (Gargalo)</TabsTrigger>
        </TabsList>

        <TabsContent value="e2e">
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
                                  isActive
                                    ? 'bg-primary text-white'
                                    : 'bg-slate-200 text-slate-500',
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
                                  <div className="flex flex-wrap gap-2 mb-2">
                                    <Badge
                                      variant="outline"
                                      className="cursor-pointer hover:bg-slate-100"
                                      onClick={() =>
                                        setMessage(
                                          'Tem um cheiro de queimado muito forte vindo do quadro!',
                                        )
                                      }
                                    >
                                      Cheiro de queimado
                                    </Badge>
                                    <Badge
                                      variant="outline"
                                      className="cursor-pointer hover:bg-slate-100"
                                      onClick={() =>
                                        setMessage('Saindo faíscas da tomada, socorro!')
                                      }
                                    >
                                      Faíscas
                                    </Badge>
                                    <Badge
                                      variant="outline"
                                      className="cursor-pointer hover:bg-slate-100"
                                      onClick={() =>
                                        setMessage(
                                          'A luz está piscando sem parar e a internet caiu.',
                                        )
                                      }
                                    >
                                      Luz piscando
                                    </Badge>
                                    <Badge
                                      variant="outline"
                                      className="cursor-pointer hover:bg-slate-100"
                                      onClick={() =>
                                        setMessage(
                                          'Minha máquina de lavar parou de funcionar e está vazando água. Preciso de ajuda urgente!',
                                        )
                                      }
                                    >
                                      Normal
                                    </Badge>
                                  </div>
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
                                    O fluxo aguarda as fotos iniciais para complementar o
                                    diagnóstico. A IA analisará a imagem.
                                  </p>
                                  <div className="flex flex-col sm:flex-row gap-3">
                                    <Button
                                      onClick={() =>
                                        handlePhotosMock(
                                          'https://img.usecurling.com/p/512/512?q=burnt%20electrical%20panel',
                                        )
                                      }
                                      variant="destructive"
                                      className="w-full sm:w-auto"
                                    >
                                      Foto: Quadro Queimado
                                    </Button>
                                    <Button
                                      onClick={() =>
                                        handlePhotosMock(
                                          'https://img.usecurling.com/p/512/512?q=clean%20electrical%20panel',
                                        )
                                      }
                                      variant="outline"
                                      className="w-full sm:w-auto"
                                    >
                                      Foto: Quadro Normal
                                    </Button>
                                  </div>
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
                                <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
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
                                  <Button
                                    variant="destructive"
                                    disabled={execStatus < 2}
                                    onClick={handleFinalize}
                                  >
                                    Tentar Concluir (Forçar Erro)
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
                      <span className="text-xs text-slate-400 font-normal">
                        #{os.id.slice(0, 8)}
                      </span>
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
                        <p className="text-sm text-slate-500 italic">
                          Nenhum log registrado ainda.
                        </p>
                      )}
                      <div ref={bottomRef} />
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="bulk">
          <Card>
            <CardHeader>
              <CardTitle>Teste de Capacidade e Roteamento (Motor de Atribuição)</CardTitle>
              <CardDescription>
                Simula a entrada simultânea de 10 Ordens de Serviço (2h de duração cada = 20h
                totais).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-slate-50 p-4 rounded-md border text-sm text-slate-700">
                <p className="font-semibold mb-2">Condições da Simulação:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    3 Técnicos serão configurados com capacidades diárias de{' '}
                    <strong>8h, 6h e 4h</strong> (Capacidade total: <strong>18h</strong>).
                  </li>
                  <li>
                    Sua localização e a das OSs serão distribuídas de forma a testar a{' '}
                    <strong>roteirização por proximidade</strong>.
                  </li>
                  <li>As OSs são disparadas simultaneamente para a engine de atribuição.</li>
                  <li>
                    <strong>Resultado Esperado:</strong> 9 OSs (18h) devem ser atribuídas aos
                    técnicos mais próximos, respeitando a capacidade máxima de cada um. 1 OS (2h)
                    não poderá ser atribuída por falta de capacidade (gargalo), garantindo proteção.
                  </li>
                </ul>
              </div>

              <Button onClick={handleBulkSimulate} disabled={runningBulk} size="lg">
                {runningBulk ? (
                  <>
                    <PlayCircle className="w-4 h-4 mr-2 animate-spin" />
                    Atribuindo OSs...
                  </>
                ) : (
                  <>
                    <PlayCircle className="w-4 h-4 mr-2" />
                    Disparar 10 OSs Simultâneas
                  </>
                )}
              </Button>

              {bulkResults.length > 0 && (
                <div className="mt-8 space-y-4 animate-fade-in-up">
                  <h3 className="text-lg font-semibold border-b pb-2">Resultados da Atribuição</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {bulkResults.map((res) => (
                      <Card
                        key={res.os.id}
                        className={cn(
                          'overflow-hidden',
                          res.data?.assigned ? 'border-green-200' : 'border-amber-200',
                        )}
                      >
                        <div
                          className={cn(
                            'px-4 py-2 flex justify-between items-center text-sm font-medium',
                            res.data?.assigned
                              ? 'bg-green-50 text-green-800'
                              : 'bg-amber-50 text-amber-800',
                          )}
                        >
                          <span>{res.os.customer_name}</span>
                          {res.data?.assigned ? (
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="w-4 h-4" /> Atribuído
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <AlertCircle className="w-4 h-4" /> Não Atribuído
                            </span>
                          )}
                        </div>
                        <div className="p-4 text-sm space-y-2">
                          <div className="flex justify-between">
                            <span className="text-slate-500">ID da OS:</span>
                            <span className="font-mono text-xs">{res.os.id.slice(0, 8)}</span>
                          </div>
                          {res.data?.assigned ? (
                            <>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Técnico Escolhido:</span>
                                <span className="font-semibold">
                                  {res.data?.name || res.data?.technician}
                                </span>
                              </div>
                            </>
                          ) : (
                            <div className="flex justify-between">
                              <span className="text-slate-500">Motivo (Gargalo):</span>
                              <span className="font-semibold text-amber-600">
                                {res.data?.reason || 'Sem capacidade'}
                              </span>
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
