import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { format, parseISO } from 'date-fns'
import { AutomationLog } from '@/types'
import { Loader2 } from 'lucide-react'

export default function LogsPage() {
  const [logs, setLogs] = useState<AutomationLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    pb.collection('automation_logs')
      .getFullList<AutomationLog>({
        sort: '-created',
        expand: 'service_order',
      })
      .then((data) => {
        setLogs(data)
        setLoading(false)
      })
      .catch(console.error)
  }, [])

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Logs de Automação</h2>
        <p className="text-muted-foreground mt-1">
          Histórico de execução de webhooks e automações do sistema.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico Recente</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Tipo (Webhook)</TableHead>
                <TableHead>Ordem de Serviço</TableHead>
                <TableHead>Ação Realizada</TableHead>
                <TableHead>Resultado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap">
                    {format(parseISO(log.created), 'dd/MM/yyyy HH:mm:ss')}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{log.webhook_type}</Badge>
                  </TableCell>
                  <TableCell>
                    {log.expand?.service_order ? (
                      <span className="font-medium text-primary">
                        {log.expand.service_order.customer_name} ({log.service_order})
                      </span>
                    ) : (
                      <span className="text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[300px] truncate" title={log.action_taken}>
                    {log.action_taken}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={log.result === 'Success' ? 'default' : 'destructive'}
                      className={log.result === 'Success' ? 'bg-green-500 hover:bg-green-600' : ''}
                    >
                      {log.result}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {logs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                    Nenhum log encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
