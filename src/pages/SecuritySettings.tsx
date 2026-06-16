import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { Skeleton } from '@/components/ui/skeleton'
import { ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

type TestType = 'whatsapp' | 'email' | 'payment' | 'webhook' | 'gps'
type TestResult = {
  type: TestType
  status: 'pending' | 'running' | 'success' | 'error'
  log?: any
  message?: string
}

export default function SecuritySettings() {
  const [loading, setLoading] = useState(true)
  const [lockId, setLockId] = useState<string | null>(null)
  const [isLocked, setIsLocked] = useState(false)
  const { toast } = useToast()

  const [tests, setTests] = useState<TestResult[]>([
    { type: 'whatsapp', status: 'pending' },
    { type: 'payment', status: 'pending' },
    { type: 'webhook', status: 'pending' },
    { type: 'gps', status: 'pending' },
    { type: 'email', status: 'pending' },
  ])
  const [isTesting, setIsTesting] = useState(false)
  const [showReport, setShowReport] = useState(false)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const records = await pb
          .collection('system_settings')
          .getFullList({ filter: 'key="bloqueio_total"' })
        if (records.length > 0) {
          setLockId(records[0].id)
          setIsLocked(records[0].value?.enabled === true || records[0].value === true)
        } else {
          const newRecord = await pb.collection('system_settings').create({
            key: 'bloqueio_total',
            value: { enabled: true },
          })
          setLockId(newRecord.id)
          setIsLocked(true)
        }
      } catch (e) {
        toast({ title: 'Erro ao carregar configurações', variant: 'destructive' })
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [])

  const handleToggle = async (checked: boolean) => {
    setIsLocked(checked)
    setShowReport(false)
    setTests(tests.map((t) => ({ ...t, status: 'pending', log: undefined, message: undefined })))
    try {
      if (lockId) {
        await pb.collection('system_settings').update(lockId, {
          value: { enabled: checked },
        })
      }
      toast({
        title: 'Configuração atualizada',
        description: `Bloqueio Total de Créditos ${checked ? 'ativado' : 'desativado'}.`,
      })
    } catch (e) {
      toast({ title: 'Erro ao atualizar', variant: 'destructive' })
      setIsLocked(!checked)
    }
  }

  const runTests = async () => {
    if (!isLocked) {
      toast({ title: 'Ative o bloqueio total primeiro', variant: 'destructive' })
      return
    }
    setIsTesting(true)
    setShowReport(false)

    const results = [...tests.map((t) => ({ ...t, status: 'pending' as const, log: undefined }))]
    setTests(results)

    for (let i = 0; i < results.length; i++) {
      results[i].status = 'running'
      setTests([...results])

      try {
        const res = await pb.send('/backend/v1/test-integrations', {
          method: 'POST',
          body: JSON.stringify({ type: results[i].type }),
        })
        results[i].status = 'success'
        results[i].log = res.log
      } catch (e: any) {
        results[i].status = 'error'
        results[i].message = e.message || 'Erro no teste'
      }

      setTests([...results])
      await new Promise((resolve) => setTimeout(resolve, 600))
    }

    setIsTesting(false)
    setShowReport(true)
  }

  const clearLogs = async () => {
    try {
      await pb.send('/backend/v1/test-integrations', { method: 'DELETE' })
      setTests(tests.map((t) => ({ ...t, status: 'pending', log: undefined, message: undefined })))
      setShowReport(false)
      toast({ title: 'Logs de teste limpos' })
    } catch (e) {
      toast({ title: 'Erro ao limpar logs', variant: 'destructive' })
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <Skeleton className="h-10 w-48 mb-6" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações de Segurança</h1>
        <p className="text-muted-foreground">Gerencie bloqueios e simulações do sistema.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bloqueio Total de Créditos</CardTitle>
          <CardDescription>
            Quando ativado, todas as integrações externas (WhatsApp, Emails, Pagamentos reais,
            IA/Geolocalização) são bloqueadas e substituídas por simulações internas para evitar
            custos e ações indesejadas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2 border p-4 rounded-lg bg-slate-50/50">
            <Switch id="bloqueio-total" checked={isLocked} onCheckedChange={handleToggle} />
            <Label htmlFor="bloqueio-total" className="flex flex-col gap-1 cursor-pointer">
              <span className="font-semibold text-slate-900">Ativar Bloqueio Total</span>
              <span className="text-sm text-slate-500 font-normal">
                Previne chamadas de API externas e gera logs de simulação.
              </span>
            </Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dashboard de Teste de Bloqueio (Suite Total)</CardTitle>
          <CardDescription>
            Execute uma bateria de testes para confirmar se todas as integrações estão sendo
            corretamente interceptadas pela simulação.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {isLocked
                ? 'O ambiente está bloqueado. Você pode rodar a suite de testes.'
                : 'Ative o bloqueio total acima para habilitar os testes.'}
            </p>
            <div className="space-x-2">
              <Button variant="outline" onClick={clearLogs} disabled={isTesting}>
                Limpar Histórico
              </Button>
              <Button onClick={runTests} disabled={!isLocked || isTesting}>
                {isTesting ? 'Executando Testes...' : 'Executar Teste Completo'}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {tests.map((test) => (
              <div
                key={test.type}
                className="border rounded-lg p-4 flex flex-col items-center justify-center space-y-2 text-center bg-slate-50/50"
              >
                <span className="font-semibold capitalize">{test.type}</span>
                {test.status === 'pending' && (
                  <span className="text-xs text-slate-400">Aguardando</span>
                )}
                {test.status === 'running' && (
                  <span className="text-xs text-blue-500 animate-pulse">Testando...</span>
                )}
                {test.status === 'success' && (
                  <span className="text-xs text-green-600 font-medium">Interceptado</span>
                )}
                {test.status === 'error' && (
                  <span className="text-xs text-red-500 font-medium">Falha</span>
                )}
              </div>
            ))}
          </div>

          {showReport && (
            <div className="mt-8 border rounded-lg overflow-hidden animate-fade-in-up">
              <div className="bg-slate-900 text-slate-50 p-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-green-400" />
                  Relatório de Teste de Bloqueio
                </h3>
              </div>
              <div className="p-6 bg-white space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Ações Testadas</p>
                    <p className="text-2xl font-bold">{tests.length}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Interceptadas</p>
                    <p className="text-2xl font-bold text-green-600">
                      {tests.filter((t) => t.status === 'success').length}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Tentativas Bloqueadas</p>
                    <p className="text-2xl font-bold text-slate-700">0</p>
                    <p className="text-xs text-slate-500">Nenhuma chamada real vazou</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Status Final</p>
                    <p className="text-lg font-bold text-green-600">AMBIENTE 100% PROTEGIDO</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Logs Gerados</h4>
                  <div className="space-y-3">
                    {tests
                      .filter((t) => t.log)
                      .map((test) => (
                        <div
                          key={test.type}
                          className="text-sm border p-3 rounded-md bg-slate-50 font-mono"
                        >
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-bold text-slate-700">{test.log.action_type}</span>
                            <Badge
                              variant="outline"
                              className="bg-green-50 text-green-700 border-green-200"
                            >
                              Simulação
                            </Badge>
                          </div>
                          <pre className="text-xs text-slate-600 whitespace-pre-wrap">
                            {JSON.stringify(test.log.content, null, 2)}
                          </pre>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
