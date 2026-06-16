import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'
import { useRealtime } from '@/hooks/use-realtime'
import { getSimulationLogs } from '@/services/simulation_logs'
import type { SimulationLog } from '@/types'

export default function SimulationLogs() {
  const [logs, setLogs] = useState<SimulationLog[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      setLoading(true)
      const data = await getSimulationLogs()
      setLogs(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('simulation_logs', () => {
    loadData()
  })

  const filteredLogs = logs.filter((log) => {
    const searchLower = search.toLowerCase()
    const contentStr = JSON.stringify(log.content).toLowerCase()
    return (
      log.action_type.toLowerCase().includes(searchLower) ||
      contentStr.includes(searchLower) ||
      log.event_source.toLowerCase().includes(searchLower)
    )
  })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Simulação – Logs</h2>
        <p className="text-muted-foreground">
          Monitore e audite todas as ações simuladas no Sandbox Mode.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Eventos Simulados</CardTitle>
          <CardDescription>
            Exibe mensagens, e-mails, pagamentos e integrações de GPS que foram interceptados sem
            acionar serviços reais.
          </CardDescription>
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filtrar logs..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button variant="outline" onClick={loadData} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Horário</TableHead>
                  <TableHead>Tipo da Ação</TableHead>
                  <TableHead>Conteúdo</TableHead>
                  <TableHead>Origem do Evento</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhum log encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium whitespace-nowrap">
                        {format(new Date(log.created), 'dd/MM/yyyy HH:mm:ss')}
                      </TableCell>
                      <TableCell>{log.action_type}</TableCell>
                      <TableCell className="max-w-[400px]">
                        <pre className="text-xs text-slate-600 bg-slate-50 p-2 rounded overflow-x-auto whitespace-pre-wrap">
                          {JSON.stringify(log.content, null, 2)}
                        </pre>
                      </TableCell>
                      <TableCell className="text-sm">{log.event_source}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                          {log.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
