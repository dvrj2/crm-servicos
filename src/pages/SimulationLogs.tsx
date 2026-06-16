import { useState, useEffect } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { getSimulationLogs, clearSimulationLogs } from '@/services/simulation_logs'
import { useSandbox } from '@/hooks/use-sandbox'
import { useRealtime } from '@/hooks/use-realtime'
import { format } from 'date-fns'
import { Trash2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import type { SimulationLog } from '@/types'

export default function SimulationLogs() {
  const { isSandbox, toggleSandbox } = useSandbox()
  const [logs, setLogs] = useState<SimulationLog[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLogs = async () => {
    try {
      const data = await getSimulationLogs()
      setLogs(data)
    } catch (error) {
      toast.error('Erro ao carregar logs de simulação')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  useRealtime('simulation_logs', () => {
    fetchLogs()
  })

  const handleClearLogs = async () => {
    try {
      await clearSimulationLogs()
      toast.success('Logs limpos com sucesso')
      fetchLogs()
    } catch (error) {
      toast.error('Erro ao limpar logs')
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto h-full overflow-y-auto pb-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Configurações – Sandbox
        </h1>
        <p className="text-muted-foreground">
          Gerencie o modo de execução da aplicação e monitore atividades simuladas.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 shrink-0">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Estado do Sistema
              {isSandbox && (
                <Badge
                  variant="destructive"
                  className="bg-amber-500 text-amber-950 border-transparent"
                >
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  SANDBOX ACTIVE
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Habilite o modo sandbox para interceptar ações reais (WhatsApp, Pagamentos, GPS) e
              apenas registrar logs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 border rounded-lg bg-white">
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-slate-900">Modo Sandbox</span>
                <span className="text-sm text-muted-foreground">
                  {isSandbox ? 'Interceptando ações reais.' : 'Ações reais serão executadas.'}
                </span>
              </div>
              <Switch
                checked={isSandbox}
                onCheckedChange={toggleSandbox}
                className="data-[state=checked]:bg-amber-600"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dashboard de Simulação</CardTitle>
            <CardDescription>Resumo das ações interceptadas pelo sistema.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between h-[88px]">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-muted-foreground">
                Total de Ações Simuladas
              </span>
              <span className="text-4xl font-bold text-slate-900">{logs.length}</span>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={logs.length === 0}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Limpar Logs
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Limpar Histórico de Simulação?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação apagará todos os {logs.length} logs de simulação registrados. Não é
                    possível reverter.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleClearLogs}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Confirmar Limpeza
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>

      <Card className="flex-1 flex flex-col min-h-[400px] overflow-hidden">
        <CardHeader className="shrink-0">
          <CardTitle>Histórico de Logs</CardTitle>
          <CardDescription>
            Lista detalhada de todas as ações interceptadas no modo sandbox.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto p-0 m-6 mt-0 border rounded-md">
          <Table>
            <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
              <TableRow>
                <TableHead className="w-[160px]">Data/Hora</TableHead>
                <TableHead className="w-[180px]">Tipo de Ação</TableHead>
                <TableHead className="w-[180px]">Status Simulado</TableHead>
                <TableHead className="w-[180px]">Origem</TableHead>
                <TableHead>Conteúdo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Carregando logs...
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhum log de simulação registrado.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium whitespace-nowrap">
                      {format(new Date(log.created), 'dd/MM/yyyy HH:mm')}
                    </TableCell>
                    <TableCell className="font-medium text-slate-700">{log.action_type}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize font-normal">
                        {log.status.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{log.event_source}</TableCell>
                    <TableCell>
                      <div className="max-w-[400px] max-h-[120px] overflow-auto">
                        <pre className="text-[11px] bg-slate-50 p-2 rounded border text-slate-600 whitespace-pre-wrap">
                          {JSON.stringify(log.content, null, 2)}
                        </pre>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
